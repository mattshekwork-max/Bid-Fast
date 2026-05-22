import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureStripeCustomer } from '@/lib/stripe-customer';

// GET to fetch the current user's information
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { user: dbUser },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// POST to create a new user (called after signup)
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existingUser) {
      // Ensure Stripe customer exists for existing users (backfill)
      if (!existingUser.stripe_customer_id && user.email) {
        try {
          await ensureStripeCustomer(supabase, user.id, user.email);
          console.log('[STRIPE] Created customer for existing user');
        } catch (error) {
          console.error('[STRIPE] Failed to create customer for existing user:', error);
        }
      }

      return NextResponse.json(
        { error: "User already exists", user: existingUser },
        { status: 409 }
      );
    }

    // Create new user
    if (!user.email) {
      return NextResponse.json(
        { error: "Email is required to create a user" },
        { status: 400 }
      );
    }

    const firstName = user.user_metadata?.first_name || null;
    const lastName = user.user_metadata?.last_name || null;

    const newUser = {
      id: user.id,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
    };

    const { error: insertError } = await supabase
      .from('users')
      .insert(newUser);

    if (insertError) {
      throw insertError;
    }

    console.log(`User created successfully: ${user.email}`);

    // Create Stripe customer for new user
    try {
      await ensureStripeCustomer(supabase, user.id, user.email);
      console.log('[STRIPE] Created customer for new user');
    } catch (stripeError) {
      console.error('[STRIPE] Failed to create customer for new user:', stripeError);
    }

    return NextResponse.json(
      { message: 'User created successfully', user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
