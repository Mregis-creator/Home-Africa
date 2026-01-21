# 🧪 Testing Rich Response Model - Quick Guide

## How to Test the Rich Response Model

### **Step 1: Open the Website**
1. Open `index.html` in your browser (or use Live Server)
2. Look for the **Rejo AI** genius sticker (headphones icon) near the footer
3. Click it to open the chatbot

### **Step 2: Test Scenarios**

#### **Test 1: Greeting Response**
**Type:** `Hello` or `Hi`

**Expected:**
- ✅ Text response greeting
- ✅ Quick reply buttons (Show me apartments, Show me cars, etc.)
- ✅ Suggested questions below

#### **Test 2: Search Listings**
**Type:** `Show me apartments` or `Are there cars available?`

**Expected:**
- ✅ Text response with count
- ✅ Rich listing cards with:
  - Images
  - Title
  - Price (RWF formatted)
  - Location
  - Type badge
  - "View" button
- ✅ Quick reply buttons
- ✅ Suggested questions

#### **Test 3: Availability Questions**
**Type:** `Are houses available?` or `Do you have properties?`

**Expected:**
- ✅ Text response
- ✅ Quick reply buttons (Show me apartments, Show me cars, Show me land plots)
- ✅ Action button (Browse All Listings)
- ✅ Suggested questions

#### **Test 4: Price Questions**
**Type:** `What's the price range?` or `How much do apartments cost?`

**Expected:**
- ✅ Text response about pricing
- ✅ Quick reply buttons (Show me affordable apartments, etc.)
- ✅ Action button (Browse with Price Filter)
- ✅ Related suggestions

#### **Test 5: Location Questions**
**Type:** `Where are properties located?` or `Show me properties in Kigali`

**Expected:**
- ✅ Text response about locations
- ✅ Quick reply buttons for popular locations
- ✅ Suggested questions about areas

#### **Test 6: How-To Questions**
**Type:** `How do I book a viewing?` or `How do I post a listing?`

**Expected:**
- ✅ Text response with instructions
- ✅ Action buttons (Post a Listing, Search Properties, Create Account)
- ✅ Suggested questions

### **Step 3: Interactive Testing**

#### **Test Quick Replies:**
1. Click any quick reply button
2. Should automatically send that message
3. Should get appropriate response

#### **Test Action Buttons:**
1. Click action buttons (e.g., "Browse All Properties")
2. Should navigate to the correct page
3. Should open in same window

#### **Test Listing Cards:**
1. Click on a listing card
2. Should navigate to listing detail page
3. Click "View" button on card
4. Should also navigate to detail page

#### **Test Suggestions:**
1. Click suggested questions
2. Should send that question automatically
3. Should get appropriate response

### **Step 4: Visual Checks**

✅ **Listing Cards:**
- Images display correctly
- Price formatted with commas
- Location shows with icon
- Type badge visible
- Hover effects work
- Clickable

✅ **Quick Replies:**
- Display as rounded buttons
- Hover effects work
- Click sends message
- Wrap properly on mobile

✅ **Action Buttons:**
- Icons display correctly
- Gradient background
- Hover effects work
- Navigate correctly

✅ **Suggestions:**
- Display in suggestion box
- Each has 💬 icon
- Clickable
- Hover effects work

### **Step 5: Mobile Testing**

1. Open on mobile device or resize browser
2. Check:
   - Cards stack vertically
   - Buttons full-width
   - Touch-friendly sizes
   - No overflow issues

### **Common Test Queries**

Try these queries to test different scenarios:

```
1. "Hello"
2. "Show me apartments"
3. "Are houses available?"
4. "What properties do you have?"
5. "How much do cars cost?"
6. "Where are properties located?"
7. "How do I book a viewing?"
8. "Show me cars in Kigali"
9. "What's the price range for apartments?"
10. "How do I post a listing?"
```

### **Expected Behavior**

- ✅ All responses include rich elements
- ✅ Quick replies appear for relevant queries
- ✅ Action buttons appear for navigation
- ✅ Suggestions appear for discovery
- ✅ Listing cards show images and details
- ✅ Everything is clickable and functional
- ✅ Mobile responsive

### **Troubleshooting**

**If cards don't show:**
- Check browser console for errors
- Verify Supabase connection
- Check if listings exist in database

**If buttons don't work:**
- Check browser console for JavaScript errors
- Verify event listeners are attached
- Check if elements exist in DOM

**If styling looks wrong:**
- Check if CSS was injected
- Verify no conflicting styles
- Check browser compatibility

### **Success Criteria**

✅ Rich response model is working if:
1. Listing cards display with images
2. Quick reply buttons appear and work
3. Action buttons navigate correctly
4. Suggestions appear and are clickable
5. Everything is mobile responsive
6. No console errors

---

## 🎉 Ready to Test!

Open your website and start chatting with Rejo AI to see the rich responses in action!





