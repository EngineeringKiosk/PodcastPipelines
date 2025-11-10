const { readFileSync } = require("fs");
const nodemailer = require("nodemailer");
const readline = require("readline");

// SMTP Configuration
const SMTP_HOST = "smtp.mailbox.org";
const SMTP_PORT = 587;
const SMTP_USER = "w.gassler@medienhof.at";
const FROM_EMAIL = "wolfi@engineeringkiosk.dev";
const FROM_NAME = "Wolfgang Gassler";

// CC email addresses - add emails here to CC on all outgoing emails
const CC_EMAILS = [
    "sarah.wagner@inwt-statistics.de",
    "andygrunwald@gmail.com",
];

// Parse command line arguments
const args = process.argv.slice(2);
const SEND_MODE = args.includes('--send');
const DRY_RUN = !SEND_MODE; // Default to dry run unless --send is specified

// Parse email file parameter
let EMAIL_FILE = null;
const fileArgIndex = args.findIndex(arg => arg.startsWith('--file='));
if (fileArgIndex !== -1) {
  EMAIL_FILE = args[fileArgIndex].split('=')[1];
} else {
  // Check for --file followed by filename
  const fileIndex = args.indexOf('--file');
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    EMAIL_FILE = args[fileIndex + 1];
  }
}

if (!EMAIL_FILE) {
  console.error("❌ No email file specified. Use --file=<filename> to specify the CSV file.");
  process.exit(1);
}

let SMTP_PASS = "";

// Email template
const EMAIL_SUBJECT = "{{podcast-name}} in der ersten großen deutschsprachigen Tech-Podcast-Umfrage";
const EMAIL_TEMPLATE = readFileSync("email_content.txt", "utf-8");

// Create SMTP transporter (will be initialized in main if needed)
let transporter;

console.log(`Dry Run Mode: ${DRY_RUN}`);
console.log(`Email File: ${EMAIL_FILE}`);
console.log(`Subject: ${EMAIL_SUBJECT}`)
console.log(`From: ${FROM_NAME} <${FROM_EMAIL}>`)
console.log(`CC Emails: ${CC_EMAILS.length > 0 ? CC_EMAILS.join(', ') : 'None'}`)

console.log(`Email Template Preview: ${EMAIL_TEMPLATE.substring(0, 300)}...`)


async function sendEmail(to, podcastName, authorName, welcome) {
  const personalizedText = EMAIL_TEMPLATE
    .replace("{{welcome}}", welcome || "Hallo,")
    .replace("{{email}}", to)
    .replace("{{podcast_name}}", podcastName);

  const personalizedSubject = EMAIL_SUBJECT
    .replace("{{podcast-name}}", podcastName);

  if (DRY_RUN) {
    console.log(`🧪 DRY RUN - Would send email to ${to} (${podcastName})`);
    console.log(`   Subject: ${personalizedSubject}`);
    console.log(`   Welcome: ${welcome}`);
    if (CC_EMAILS.length > 0) {
      console.log(`   CC: ${CC_EMAILS.join(', ')}`);
    }
    return true;
  }

  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: to,
    subject: personalizedSubject,
    text: personalizedText,
  };

  // Add CC emails if configured
  if (CC_EMAILS.length > 0) {
    mailOptions.cc = CC_EMAILS.join(',');
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to} (${podcastName}): ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to} (${podcastName}):`, error.message);
    return false;
  }
}

function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  return data;
}

async function getPasswordInput() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Hide input for password
    rl.stdoutMuted = true;
    rl.question('Enter SMTP password: ', (password) => {
      rl.close();
      console.log(''); // New line after password input
      resolve(password);
    });
    
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (rl.stdoutMuted)
        rl.output.write("*");
      else
        rl.output.write(stringToWrite);
    };
  });
}

async function main() {
  try {
    // Show mode information
    if (DRY_RUN) {
      console.log("🧪 DRY RUN MODE - No emails will be sent");
      console.log("   Use --send parameter to actually send emails");
    } else {
      console.log("📧 SEND MODE - Emails will be sent");
      
      // Get SMTP password interactively
      SMTP_PASS = await getPasswordInput();
      
      // Initialize SMTP transporter
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: false,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
      
      // Test SMTP connection
      console.log("🔌 Testing SMTP connection...");
      try {
        await transporter.verify();
        console.log("✅ SMTP connection successful");
      } catch (error) {
        console.error("❌ SMTP connection failed:", error.message);
        return;
      }
    }
    
    // Read the CSV file
    const csvContent = readFileSync(EMAIL_FILE, "utf-8");
    const data = parseCSV(csvContent);
    
    console.log(`\n📧 Preparing to process ${data.length} podcasts...`);
    
    let successCount = 0;
    let failCount = 0;
    let duplicateCount = 0;
    const processedEmails = new Set(); // Track emails we've already processed
    const duplicateEmails = new Set(); // Track duplicate emails

    for (const podcast of data) {
      // Skip podcasts with no emails
      if (!podcast.Emails || podcast.Emails.trim() === '') {
        console.log(`⚠️ Skipping ${podcast['Podcast Name']} - no emails`);
        continue;
      }
      
      // Split emails by space and send to each one
      const emails = podcast.Emails.split(' ').filter(email => email.trim() !== '');
      
      for (const email of emails) {
        const emailAddress = email.trim().toLowerCase(); // Normalize for comparison
        
        // Check if we've already processed this email
        if (processedEmails.has(emailAddress)) {
          console.log(`⚠️ Skipping duplicate email ${email.trim()} (${podcast['Podcast Name']})`);
          duplicateCount++;
          duplicateEmails.add(emailAddress);
          continue;
        }
        
        // Add to processed set
        processedEmails.add(emailAddress);
        
        const success = await sendEmail(
          email.trim(), 
          podcast['Podcast Name'], 
          podcast['Author Names'], 
          podcast.Welcome
        );
        
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
        
        // Add delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
      }
    }
    
    console.log(`\n📊 Email sending completed:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   � Duplicates skipped: ${duplicateCount}`);
    console.log(`   �📋 Total processed: ${successCount + failCount}`);
    console.log(`   📧 Unique emails: ${processedEmails.size}`);
    console.log(`   📧 Duplicate emails: ${Array.from(duplicateEmails).join(", ")}`);

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { sendEmail, main };
