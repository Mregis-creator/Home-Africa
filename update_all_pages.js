/**
 * Script to update all HTML pages with chatbot integration
 * Run this in Node.js or use as reference for manual updates
 */

const fs = require('fs');
const path = require('path');

const htmlFiles = [
  'index.html',
  'cars.html',
  'apartment.html',
  'land.html',
  'post.html',
  'dashboard.html',
  'profile.html',
  'car-detail.html',
  'apartment-detail.html',
  'land-detail.html',
  'signup.html',
  'signin.html',
  'about.html',
  'booking.html',
  'driving-school.html',
  'standard.html',
  'premium.html',
  'provisional.html',
  'permanent.html',
  'combined.html',
  'basic.html'
];

const chatbotNavLink = `
          <li class="nav-item">
            <a class="nav-link nav-link-chatbot" href="#" data-chatbot-trigger="true" title="Chat with AI Assistant">
              <i class="bi bi-robot"></i> AI Assistant
            </a>
          </li>`;

const chatbotScripts = `
  <!-- Supabase Client -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/supabase-config.js"></script>
  
  <!-- AI Chatbot -->
  <script src="js/ai-chatbot.js"></script>`;

function updatePage(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Add navbar link if navbar exists and doesn't have chatbot link
    if (content.includes('navbar-nav') && !content.includes('nav-link-chatbot')) {
      // Find the last nav-item before closing </ul>
      const navPattern = /(<li class="nav-item">.*?<\/li>\s*)(<\/ul>)/s;
      if (navPattern.test(content)) {
        content = content.replace(navPattern, `$1${chatbotNavLink}\n        $2`);
        updated = true;
      }
    }

    // Add scripts before </body> if not present
    if (!content.includes('js/ai-chatbot.js')) {
      const bodyClosePattern = /(\s*)(<\/body>)/;
      if (bodyClosePattern.test(content)) {
        content = content.replace(bodyClosePattern, `${chatbotScripts}$1$2`);
        updated = true;
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  Skipped: ${filePath} (already updated or no changes needed)`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Update all files
console.log('Starting to update all HTML pages...\n');
let updatedCount = 0;

htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    if (updatePage(filePath)) {
      updatedCount++;
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log(`\n✅ Completed! Updated ${updatedCount} files.`);

