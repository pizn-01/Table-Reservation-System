import { supabaseAdmin } from './config/database';
import { generateSlug } from './utils/slug';

async function seed() {
  console.log('🌱 Seeding default restaurant...');

  const restaurantName = 'Blackstone';
  const slug = 'blackstone';

  const { data: existing } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    console.log('✅ Restaurant "blackstone" already exists.');
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: restaurantName,
      slug,
      description: 'Experience authentic italian cuisine in an elegant atmosphere',
      address: '123 Dining Street, London',
      is_active: true,
      setup_completed: true,
      setup_step: 4
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error seeding restaurant:', error);
  } else {
    console.log('✅ Successfully seeded Blackstone restaurant:', data.id);
  }
}

seed().catch(console.error);
