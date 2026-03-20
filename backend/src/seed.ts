import { supabaseAdmin } from './config/database';
import { generateSlug } from './utils/slug';

async function seed() {
  console.log('🌱 Seeding restaurants...');

  const restaurants = [
    {
      name: 'Blackstone',
      slug: 'blackstone',
      description: 'Experience authentic italian cuisine in an elegant atmosphere',
      address: '123 Dining Street, London'
    },
    {
      name: 'PIZN Dinners',
      slug: 'pizn-dinners',
      description: 'Modern fusion dining at its best.',
      address: '456 Gourmet Ave, New York'
    }
  ];

  for (const r of restaurants) {
    const { data: existing } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('slug', r.slug)
      .single();

    if (existing) {
      console.log(`✅ Restaurant "${r.slug}" already exists.`);
      continue;
    }

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: r.name,
        slug: r.slug,
        description: r.description,
        address: r.address,
        is_active: true,
        setup_completed: true,
        setup_step: 4
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error seeding restaurant "${r.slug}":`, error);
    } else {
      console.log(`✅ Successfully seeded "${r.name}" (${r.slug}):`, data.id);
    }
  }
}

seed().catch(console.error);
