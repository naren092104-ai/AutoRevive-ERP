import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function seedHolidays() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Naren@0921',
    database: process.env.DB_NAME || 'autorevive_hr'
  });

  const govtHolidays2026 = [
    { name: "New Year's Day", date: "2026-01-01", day: "Thursday", type: "Public Holiday" },
    { name: "Pongal / Makar Sankranti", date: "2026-01-14", day: "Wednesday", type: "Govt / State Festival" },
    { name: "Thiruvalluvar Day", date: "2026-01-15", day: "Thursday", type: "Govt Holiday" },
    { name: "Uzhavar Thirunal", date: "2026-01-16", day: "Friday", type: "Govt Holiday" },
    { name: "Republic Day", date: "2026-01-26", day: "Monday", type: "National Holiday" },
    { name: "Ugadi / Telugu New Year", date: "2026-03-19", day: "Thursday", type: "Public Holiday" },
    { name: "Ramzan / Eid-ul-Fitr", date: "2026-03-30", day: "Monday", type: "Govt Holiday" },
    { name: "Good Friday", date: "2026-04-03", day: "Friday", type: "Public Holiday" },
    { name: "Tamil New Year & Dr. B.R. Ambedkar Jayanti", date: "2026-04-14", day: "Tuesday", type: "Govt Holiday" },
    { name: "May Day / International Labour Day", date: "2026-05-01", day: "Friday", type: "National Holiday" },
    { name: "Bakrid / Eid al-Adha", date: "2026-06-06", day: "Saturday", type: "Govt Holiday" },
    { name: "Muharram", date: "2026-07-07", day: "Tuesday", type: "Govt Holiday" },
    { name: "Independence Day", date: "2026-08-15", day: "Saturday", type: "National Holiday" },
    { name: "Krishna Jayanti / Gokulashtami", date: "2026-09-04", day: "Friday", type: "Govt Holiday" },
    { name: "Milad-un-Nabi / Id-e-Milad", date: "2026-09-14", day: "Monday", type: "Govt Holiday" },
    { name: "Gandhi Jayanti", date: "2026-10-02", day: "Friday", type: "National Holiday" },
    { name: "Ayutha Pooja & Saraswathi Pooja", date: "2026-10-19", day: "Monday", type: "Govt / State Festival" },
    { name: "Vijaya Dasami", date: "2026-10-20", day: "Tuesday", type: "Govt Holiday" },
    { name: "Deepavali / Diwali", date: "2026-11-08", day: "Sunday", type: "Govt / National Festival" },
    { name: "Christmas Day", date: "2026-12-25", day: "Friday", type: "National Holiday" }
  ];

  for (const h of govtHolidays2026) {
    await conn.query(`
      INSERT INTO company_holidays (name, holiday_date, day_name, holiday_type, year)
      VALUES (?, ?, ?, ?, 2026)
      ON DUPLICATE KEY UPDATE name = VALUES(name), day_name = VALUES(day_name), holiday_type = VALUES(holiday_type)
    `, [h.name, h.date, h.day, h.type]);
  }

  console.log(`Seeded ${govtHolidays2026.length} official 2026 Government holidays successfully!`);
  await conn.end();
}

seedHolidays().catch(console.error);
