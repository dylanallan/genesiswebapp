-- Genesis Heritage Pro: Sample Seed Data
-- Run this script in your Supabase SQL editor to populate your database with sample data for the demo.
-- Note: This assumes you have already run market_ready_schema.sql

-- Clear existing data (optional, use with caution)
-- TRUNCATE TABLE user_profiles, celebrations, traditions, cultural_stories, cultural_artifacts, family_contacts, recipes, timeline_events, automation_workflows, knowledge_base RESTART IDENTITY;

BEGIN;

-- 1. Create a sample user profile
-- Make sure to replace this with the actual user ID from your Supabase Auth users table if you want to link it to a real user.
-- Or, run this and then sign up with a new user to get a clean profile.
INSERT INTO public.user_profiles (id, display_name, cultural_background, business_goals, onboarding_completed)
VALUES 
(gen_random_uuid(), 'Alex Chen', 'Chinese-Malaysian', 'Expand my family''s restaurant business by integrating our cultural heritage into our brand.', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Add Cultural Traditions
INSERT INTO public.traditions (user_id, name, description, origin, modern_application)
SELECT id, 'Yum Cha (飲茶)', 'A traditional Cantonese brunch involving Chinese tea and dim sum.', 'Guangzhou, China, in the late 19th century.', 'A weekly family gathering event at our restaurant to foster community and share stories.'
FROM public.user_profiles WHERE display_name = 'Alex Chen';

INSERT INTO public.traditions (user_id, name, description, origin, modern_application)
SELECT id, 'Red Envelope (红包)', 'Gifting money in red paper envelopes during special occasions like Chinese New Year or weddings.', 'Song Dynasty, China.', 'A digital red envelope feature in our loyalty app to gift discounts and special offers to customers during holidays.'
FROM public.user_profiles WHERE display_name = 'Alex Chen';

-- 3. Add a Recipe
INSERT INTO public.recipes (user_id, name, description, ingredients, instructions, cultural_significance)
SELECT 
  id, 
  'Grandma''s Char Siu (叉烧)', 
  'A secret family recipe for Cantonese BBQ pork, passed down through three generations.',
  '{"Pork Shoulder": "2 lbs", "Hoisin Sauce": "1/2 cup", "Soy Sauce": "1/4 cup", "Honey": "1/4 cup", "Five Spice Powder": "1 tsp"}',
  '{"Step 1": "Marinate pork overnight.", "Step 2": "Roast at 375°F for 45 minutes, basting every 15 minutes.", "Step 3": "Broil for the final 2-3 minutes for a perfect glaze."}',
  'This dish is the centerpiece of our family gatherings and a symbol of prosperity.'
FROM public.user_profiles WHERE display_name = 'Alex Chen';

-- 4. Add a Timeline Event
INSERT INTO public.timeline_events (user_id, title, description, event_date, category)
SELECT id, 'Opened "The Jade Dragon" Restaurant', 'My grandfather opened our first family restaurant in Kuala Lumpur.', '1968-07-20', 'Business Milestone'
FROM public.user_profiles WHERE display_name = 'Alex Chen';

-- 5. Add an Automation Workflow
INSERT INTO public.automation_workflows (user_id, name, trigger_conditions, actions)
SELECT 
  id, 
  'New Year Customer Engagement',
  '{"trigger": "date", "value": "February 1st"}',
  '[{"action": "send_email", "template_id": "new_year_promo_v2"}, {"action": "issue_digital_red_envelope", "amount": 8.88}]'
FROM public.user_profiles WHERE display_name = 'Alex Chen';

-- 6. Add to Knowledge Base
-- Note: You would typically call the 'generate-knowledge-embedding' function for this.
-- This is a placeholder for demonstration. The embedding vector would be 1536-dimensional.
INSERT INTO public.knowledge_base (content, content_length, content_tokens, metadata)
VALUES
('The tradition of serving "longevity noodles" (长寿面) on birthdays is a cornerstone of Chinese food culture, symbolizing a wish for a long and healthy life. These noodles are typically left uncut to represent the eater''s long life.', 230, 58, '{"source": "Cultural Handbook", "topic": "Food Traditions"}');

INSERT INTO public.knowledge_base (content, content_length, content_tokens, metadata)
VALUES
('In Feng Shui, the entrance of a business is considered the "mouth of qi," where energy and opportunities flow in. It should be bright, clean, and welcoming. Avoid placing mirrors directly facing the entrance as they are believed to push wealth away.', 260, 65, '{"source": "Business Guide", "topic": "Feng Shui"}');

COMMIT;

-- You can add more sample data for other tables like celebrations, cultural_stories, etc., following this pattern. 