const { db } = require('./server/db');

const studentList = [
  // Image 4: CSE-A & CSE-B
  { name: "Y. Akshaya", section: "CSE-A", roll: "254G1A0517", email: "254g1a0517@srit.ac.in", phone: "9014620331" },
  { name: "D. Anitha Krupa", section: "CSE-A", roll: "254G1A0526", email: "254g1a0526@srit.ac.in", phone: "9989400310" },
  { name: "Bharani Kumar Undra", section: "CSE-A", roll: "254G1A0541", email: "254G1A0541@srit.ac.in", phone: "9392300975" },
  { name: "D. Chand Naveed", section: "CSE-A", roll: "254G1A0550", email: "254G1A0550@srit.ac.in", phone: "9491052753" },
  { name: "Chandu B R", section: "CSE-A", roll: "254G1A0552", email: "254g1a0552@srit.ac.in", phone: "6361911096" },
  { name: "O. Deepika", section: "CSE-A", roll: "254G1A0560", email: "254g1a0560@srit.ac.in", phone: "9182256041" },
  { name: "Geethika A", section: "CSE-B", roll: "254G1A0575", email: "254G1A0575@srit.ac.in", phone: "9014180293" },
  { name: "Gireeshma D", section: "CSE-B", roll: "254G1A0577", email: "254g1a0577@srit.ac.in", phone: "9493275145" },
  { name: "B.S. Gousiya", section: "CSE-B", roll: "254G1A0579", email: "254g1a0579@srit.ac.in", phone: "9515916520" },
  { name: "N. Gousiya Hajira Nadba", section: "CSE-B", roll: "254G1A0580", email: "254g1a0580@srit.ac.in", phone: "7981931598" },
  { name: "D. Govardhan", section: "CSE-B", roll: "254G1A0581", email: "254g1a0581@srit.ac.in", phone: "9392985012" },
  { name: "V. Harika Reddy", section: "CSE-B", roll: "254G1A0588", email: "254g1a0588@srit.ac.in", phone: "8639712596" },
  { name: "Harish U", section: "CSE-B", roll: "254G1A0590", email: "254g1a0590@srit.ac.in", phone: "9391924059" },
  { name: "G. Harsha Vardhan", section: "CSE-B", roll: "254G1A0591", email: "254g1a0591@srit.ac.in", phone: "7617643043" },
  { name: "Harshitha K", section: "CSE-B", roll: "254G1A0597", email: "254g1a0597@srit.ac.in", phone: "7396537469" },

  // Image 1: CSE-B & CSE-C
  { name: "G.H. Hasana", section: "CSE-B", roll: "254G1A0598", email: "254g1a0598@srit.ac.in", phone: "8790332226" },
  { name: "K.C. Kondappa", section: "CSE-B", roll: "254G1A05A0", email: "254g1a05a0@srit.ac.in", phone: "9550624318" },
  { name: "Himavarsha Palabandla", section: "CSE-B", roll: "254G1A05A4", email: "254g1a05a4@srit.ac.in", phone: "6304188476" },
  { name: "P. Jyoshika", section: "CSE-B", roll: "254G1A05B7", email: "254g1a05b7@srit.ac.in", phone: "6302500552" },
  { name: "S. Kanees Farida", section: "CSE-B", roll: "254G1A05B9", email: "254g1a05b9@srit.ac.in", phone: "8074340242" },
  { name: "Kavya S", section: "CSE-B", roll: "254G1A05C4", email: "254g1a05c4@srit.ac.in", phone: "8008801368" },
  { name: "K.V. Keerthi", section: "CSE-B", roll: "254G1A05C8", email: "254g1a05c8@srit.ac.in", phone: "9322365529" },
  { name: "S. Lavanya", section: "CSE-C", roll: "254G1A05E0", email: "254g1a05e0@srit.ac.in", phone: "7337508736" },
  { name: "J. Likhitha", section: "CSE-C", roll: "254G1A05E4", email: "254g1a05e4@srit.ac.in", phone: "9573498670" },
  { name: "Lohith S", section: "CSE-C", roll: "254G1A05E6", email: "254g1a05e6@srit.ac.in", phone: "9515968230" },
  { name: "Mary M", section: "CSE-C", roll: "254G1A05G5", email: "254g1a05g5@srit.ac.in", phone: "9059531487" },
  { name: "Akbarsab Mohammed Jaffer Sadiq", section: "CSE-C", roll: "254G1A05H1", email: "254g1a05h1@srit.ac.in", phone: "9391669255" },
  { name: "Shaik Mohammed Muheeb Muhiuddin", section: "CSE-C", roll: "254G1A05H2", email: "254g1a05h2@srit.ac.in", phone: "9866137776" },
  { name: "K. Mounika", section: "CSE-C", roll: "254G1A05H5", email: "254g1a05h5@srit.ac.in", phone: "9182693071" },
  { name: "Vellala Lingeswara Reddy", section: "CSE-C", roll: "264G5A0515", email: "264g5a0515@srit.ac.in", phone: "9642692095" },
  { name: "K. Mohammad Yaseen", section: "CSE-C", roll: "264G5A0519", email: "264g5a0519@srit.ac.in", phone: "6304209180" },

  // Image 2: CSE-C, CSE-D, CSE-E, CSE-F
  { name: "Vankam Navaneeth", section: "CSE-C", roll: "264G5A0520", email: "264g5a0520@srit.ac.in", phone: "9390083261" },
  { name: "Nikhila P", section: "CSE-D", roll: "254G1A05L5", email: "254g1a05l5@srit.ac.in", phone: "6303782580" },
  { name: "R. Parishreya", section: "CSE-D", roll: "254G1A05M4", email: "254g1a05m4@srit.ac.in", phone: "7675969478" },
  { name: "K. Poojitha Royal", section: "CSE-D", roll: "254G1A05N4", email: "254g1a05n4@srit.ac.in", phone: "8977661333" },
  { name: "Sai Charan Reddy Sankepalli", section: "CSE-E", roll: "254G1A05T0", email: "254g1a05t0@srit.ac.in", phone: "8074614684" },
  { name: "P. Sai Jahnavi", section: "CSE-E", roll: "254G1A05T2", email: "254g1a05t2@srit.ac.in", phone: "6301147996" },
  { name: "Kota Sai Venkata Sumanth Reddy", section: "CSE-E", roll: "254G1A05T6", email: "254g1a05t6@srit.ac.in", phone: "6304964717" },
  { name: "K. Shanwaz", section: "CSE-E", roll: "254G1A05V7", email: "254g1a05v7@srit.ac.in", phone: "7672035981" },
  { name: "B. Uha", section: "CSE-F", roll: "254G1A05AE", email: "254g1a05ae@srit.ac.in", phone: "9515508598" },
  { name: "Usha Sri M", section: "CSE-F", roll: "254G1A05AH", email: "254g1a05ah@srit.ac.in", phone: "9059299601" },
  { name: "G. Ushasri Sai", section: "CSE-F", roll: "254G1A05AJ", email: "254g1a05aj@srit.ac.in", phone: null },
  { name: "S. Zunaira", section: "CSE-F", roll: "254G1A05AP", email: "254g1a05ap@srit.ac.in", phone: "8500852026" },
  { name: "Varsha T", section: "CSE-F", roll: "254G1A05AQ", email: "254g1a05aq@srit.ac.in", phone: "9398224099" },
  { name: "D. Vazeer Aman", section: "CSE-F", roll: "254G1A05AT", email: "254g1a05at@srit.ac.in", phone: "9704925392" },
  { name: "G. Veena", section: "CSE-F", roll: "254G1A05AU", email: "254g1a05au@srit.ac.in", phone: "8688592771" },

  // Image 3: CSE-F & CSE-B
  { name: "Venkata Greeshma Sakam", section: "CSE-F", roll: "254G1A05AV", email: "254g1a05av@srit.ac.in", phone: "6303417879" },
  { name: "Srivalli Rupanagudi", section: "CSE-F", roll: "254G1A05AW", email: "254g1a05aw@srit.ac.in", phone: "7569593885" },
  { name: "Tejaswi B", section: "CSE-F", roll: "254G1A05AX", email: "254g1a05ax@srit.ac.in", phone: "8341789249" },
  { name: "G. Vennela", section: "CSE-F", roll: "254G1A05BB", email: "254g1a05bb@srit.ac.in", phone: "9964721445" },
  { name: "C. Vinitha Reddy", section: "CSE-F", roll: "254G1A05BG", email: "254g1a05bg@srit.ac.in", phone: "9392772854" },
  { name: "Vyshnavi M", section: "CSE-F", roll: "254G1A05BR", email: "254g1a05br@srit.ac.in", phone: "6303893810" },
  { name: "Yaswanth Sai Teja Sake", section: "CSE-F", roll: "254G1A05BW", email: "sakeyaswanth633@gmail.com", phone: "9849385578" },
  { name: "Yashwitha A", section: "CSE-F", roll: "254G1A05BX", email: "254g1a05bx@srit.ac.in", phone: null },
  { name: "D. Yuva Sri", section: "CSE-F", roll: "254G1A05BZ", email: "254g1a05bz@srit.ac.in", phone: "9381609973" },
  { name: "Devzai Zuha", section: "CSE-F", roll: "254G1A05CA", email: "254g1a05ca@srit.ac.in", phone: "6302254708" },
  { name: "G. Tejaswini", section: "CSE-F", roll: "254G1A05Z4", email: "254g1a05z4@srit.ac.in", phone: "9100016227" },
  { name: "G. Thanuja", section: "CSE-F", roll: "254G1A05Z7", email: "254g1a05z7@srit.ac.in", phone: "6281538149" },
  { name: "U. Thanusree", section: "CSE-F", roll: "254G1A05Z9", email: "254g1a05z9@srit.ac.in", phone: "9281018735" },
  { name: "P. Sai Venkata Krutheek", section: "CSE-F", roll: "264G5A0534", email: "264g5a0534@srit.ac.in", phone: "7601060569" },
  { name: "S. Vinuthana Sri", section: "CSE-B", roll: "254G1A05BJ", email: "254g1a05bj@srit.ac.in", phone: "9014598388" }
];

console.log(`Processing ${studentList.length} students...`);

const insertStmt = db.prepare(`
  INSERT INTO club_members (
    full_name,
    college_id,
    email,
    phone,
    year,
    branch,
    position,
    department_id,
    joining_date,
    status,
    notes,
    is_demo,
    created_by
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'admin'
  )
`);

const checkStmt = db.prepare('SELECT id, full_name FROM club_members WHERE college_id = ?');
const updateStmt = db.prepare(`
  UPDATE club_members SET
    full_name = ?,
    email = ?,
    phone = ?,
    year = ?,
    branch = ?,
    position = ?,
    notes = ?,
    status = 'Active'
  WHERE id = ?
`);

const today = new Date().toISOString().split('T')[0];

let inserted = 0;
let updated = 0;

const run = db.transaction(() => {
  for (const s of studentList) {
    const roll = s.roll.trim().toUpperCase();
    const branchName = `Computer Science & Engineering (${s.section})`;
    const noteText = `Section: ${s.section}`;
    const existing = checkStmt.get(roll);

    if (existing) {
      updateStmt.run(s.name, s.email, s.phone, '2nd Year', branchName, 'Club Member', noteText, existing.id);
      updated++;
    } else {
      insertStmt.run(
        s.name,
        roll,
        s.email,
        s.phone,
        '2nd Year',
        branchName,
        'Club Member',
        null, // department_id
        today,
        'Active',
        noteText
      );
      inserted++;
    }
  }
});

run();

console.log(`Done! Inserted: ${inserted}, Updated: ${updated}. Total in database:`, db.prepare('SELECT COUNT(*) as c FROM club_members').get().c);
