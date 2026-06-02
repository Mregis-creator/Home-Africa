# Batch Update Instructions for AI Chatbot

## Files Already Updated:
- ✅ index.html
- ✅ cars.html
- ✅ apartment.html
- ✅ land.html
- ✅ post.html

## Remaining Files to Update:

### Pattern 1: Add Navbar Link
Find this pattern:
```html
          <li class="nav-item"><a class="nav-link" href="about.html">About Us</a></li>
        </ul>
```

Replace with:
```html
          <li class="nav-item"><a class="nav-link" href="about.html">About Us</a></li>
          <li class="nav-item">
            <a class="nav-link nav-link-chatbot" href="#" data-chatbot-trigger="true" title="Chat with AI Assistant">
              <i class="bi bi-robot"></i> AI Assistant
            </a>
          </li>
        </ul>
```

### Pattern 2: Add Scripts Before </body>
Find:
```html
</body>
</html>
```

Replace with:
```html
  <!-- Supabase Client -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/supabase-config.js"></script>
  
  <!-- AI Chatbot -->
  <script src="js/ai-chatbot.js"></script>
</body>
</html>
```

## Files to Update:
1. dashboard.html
2. profile.html
3. car-detail.html
4. apartment-detail.html
5. land-detail.html
6. signup.html
7. signin.html
8. about.html
9. booking.html
10. driving-school.html
11. standard.html
12. premium.html
13. provisional.html
14. permanent.html
15. combined.html
16. basic.html

