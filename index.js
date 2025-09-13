const { Client, GatewayIntentBits, Partials, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// أمر إعداد القائمة
client.on("messageCreate", async (message) => {
  if (message.content === "!setup") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket-menu")
      .setPlaceholder("اختر نوع التذكرة")
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel("🎧 الدعم الفني").setValue("support"),
        new StringSelectMenuOptionBuilder().setLabel("⚠️ الشكاوي").setValue("complaint"),
        new StringSelectMenuOptionBuilder().setLabel("🛒 شراء").setValue("buy"),
        new StringSelectMenuOptionBuilder().setLabel("❓ أخرى").setValue("other")
      );

    const row = new ActionRowBuilder().addComponents(menu);

    await message.channel.send({
      content: "🎫 اختر نوع التذكرة من القائمة:",
      components: [row],
    });
  }
});

// عند اختيار نوع التذكرة
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "ticket-menu") return;

  const categoryId = {
    support: "ID_CATEGORY_SUPPORT",
    complaint: "ID_CATEGORY_COMPLAINT",
    buy: "ID_CATEGORY_BUY",
    other: "ID_CATEGORY_OTHER",
  };

  const value = interaction.values[0];
  const category = categoryId[value];

  if (!category) {
    return interaction.reply({
      content: "❌ لا يوجد كاتيجوري لهذا الخيار",
      ephemeral: true,
    });
  }

  const ticketChannel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`,
    type: ChannelType.GuildText,
    parent: category,
    permissionOverwrites: [
      { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
    ],
  });

  const closeButton = new ButtonBuilder()
    .setCustomId("close-ticket")
    .setLabel("🔒 إغلاق التذكرة")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(closeButton);

  await interaction.reply({
    content: `✅ تم إنشاء التذكرة: ${ticketChannel}`,
    ephemeral: true,
  });

  ticketChannel.send({
    content: `🎫 مرحباً ${interaction.user}, الرجاء شرح مشكلتك هنا.`,
    components: [row],
  });
});

// عند الضغط على زر إغلاق التذكرة
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId === "close-ticket") {
    if (!interaction.channel.name.startsWith("ticket-")) {
      return interaction.reply({ content: "❌ هذا ليس روم تذكرة", ephemeral: true });
    }

    await interaction.reply("🔒 جاري إغلاق التذكرة...");
    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 3000);
  }
});

client.login(process.env.TOKEN);
