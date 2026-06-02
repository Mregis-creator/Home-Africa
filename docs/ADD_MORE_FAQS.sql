-- Additional FAQs for REJO AI Knowledge Base
-- Run this in Supabase SQL Editor to add more FAQs

INSERT INTO ai_knowledge_base (category, question, answer, keywords, priority, language) VALUES

-- Availability Questions
('listings', 'Are houses available?', 'Yes! We have many houses and apartments available for rent and sale. You can browse our Apartments page to see all available properties. Would you like me to search for houses in a specific location?', ARRAY['houses', 'available', 'have', 'properties', 'apartments'], 10, 'en'),

('listings', 'Do you have apartments?', 'Yes, we have many apartments available! You can browse them on our Apartments page. I can also help you search for apartments in a specific area or price range. Just let me know what you''re looking for!', ARRAY['apartments', 'have', 'available', 'properties'], 10, 'en'),

('listings', 'Are there cars for sale?', 'Yes! We have a wide selection of cars available for sale. Visit our Cars page to browse vehicles by make, model, year, and price. I can help you find specific cars too!', ARRAY['cars', 'vehicles', 'sale', 'available', 'buy'], 10, 'en'),

('listings', 'Do you sell land?', 'Yes, we have land plots available for sale! Check our Land Plots page to see available properties. I can help you find land in specific locations or sizes.', ARRAY['land', 'plots', 'sell', 'available', 'property'], 10, 'en'),

-- Greetings & Common Questions
('general', 'Hello', 'Hello! 👋 I''m REJO AI, your HOME AFRICA assistant. How can I help you today?', ARRAY['hello', 'hi', 'hey', 'greetings'], 10, 'en'),

('general', 'Hi', 'Hi there! 👋 I''m REJO AI. Are you looking for apartments, houses, cars, or land plots? I''m here to help!', ARRAY['hi', 'hello', 'hey'], 9, 'en'),

('general', 'Good morning', 'Good morning! ☀️ I''m REJO AI. How can I assist you in finding your perfect property or vehicle today?', ARRAY['good morning', 'morning', 'gm'], 9, 'en'),

('general', 'Good afternoon', 'Good afternoon! 🌤️ I''m REJO AI. What can I help you with today?', ARRAY['good afternoon', 'afternoon'], 9, 'en'),

('general', 'Good evening', 'Good evening! 🌙 I''m REJO AI. How can I help you find what you''re looking for?', ARRAY['good evening', 'evening'], 9, 'en'),

-- Property Availability Variations
('listings', 'What properties do you have?', 'We have apartments, houses, cars, and land plots available! You can browse each category on our website. What type of property are you interested in?', ARRAY['properties', 'what', 'have', 'available', 'listings'], 9, 'en'),

('listings', 'What do you sell?', 'We help you find apartments, houses, cars, and land plots! Our platform connects buyers with sellers. What are you looking for?', ARRAY['sell', 'what', 'offer', 'have'], 9, 'en'),

('listings', 'What listings are available?', 'We have many listings available across different categories: apartments, houses, cars, and land plots. Each category has filters to help you find exactly what you need. What are you interested in?', ARRAY['listings', 'available', 'what', 'have'], 9, 'en'),

-- Location Questions
('listings', 'Do you have properties in Kigali?', 'Yes! We have many properties in Kigali including apartments, houses, cars, and land plots. You can filter by location on each category page. Would you like me to search for something specific in Kigali?', ARRAY['kigali', 'properties', 'location', 'where'], 8, 'en'),

('listings', 'Where are your properties located?', 'Our properties are located throughout Rwanda, with many listings in Kigali and other major cities. You can filter listings by location on each category page. What area are you interested in?', ARRAY['where', 'location', 'located', 'area'], 8, 'en'),

-- Price Questions
('listings', 'How much do apartments cost?', 'Apartment prices vary depending on location, size, and amenities. Prices range from affordable options to premium properties. You can filter by price range on our Apartments page. What''s your budget?', ARRAY['price', 'cost', 'how much', 'apartments'], 8, 'en'),

('listings', 'What are your prices?', 'Prices vary depending on the type of property and location. You can browse our listings and use filters to find properties within your budget. What type of property are you looking for?', ARRAY['price', 'prices', 'cost', 'how much'], 8, 'en'),

-- Service Questions
('general', 'What can you help me with?', 'I''m REJO AI, and I can help you: find apartments, houses, cars, and land plots; answer questions about our services; guide you through booking viewings; and provide information about HOME AFRICA. What do you need help with?', ARRAY['help', 'what', 'can', 'do', 'assist'], 9, 'en'),

('general', 'What services do you offer?', 'HOME AFRICA offers a platform to find apartments, houses, cars, and land plots. We also connect you with driving schools. I can help you search for properties, answer questions, and guide you through bookings. What can I help you with?', ARRAY['services', 'offer', 'what', 'do'], 8, 'en'),

-- Thank You Responses
('general', 'Thank you', 'You''re welcome! 😊 Is there anything else I can help you with?', ARRAY['thank', 'thanks', 'thank you'], 7, 'en'),

('general', 'Thanks', 'You''re welcome! 😊 Feel free to ask if you need anything else!', ARRAY['thanks', 'thank'], 7, 'en'),

-- Help Requests
('general', 'Help', 'I''m here to help! I can assist you with finding properties, answering questions, or guiding you through our services. What do you need help with?', ARRAY['help', 'assist', 'support'], 8, 'en'),

('general', 'I need help', 'I''m REJO AI, and I''m here to help! I can help you find apartments, houses, cars, or land plots. I can also answer questions about our services. What do you need?', ARRAY['need help', 'help', 'assistance'], 8, 'en');

-- Update search vectors for the new entries (trigger will handle this automatically)

