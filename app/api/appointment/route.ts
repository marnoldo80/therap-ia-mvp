import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function PUT(request: NextRequest) {
  try {
    const { appointmentId, title, startsAt, endsAt, location, notes } = await request.json();

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID mancante' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({
        title,
        starts_at: startsAt,
        ends_at: endsAt,
        location,
        notes
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, appointment: data });

  } catch (error: any) {
    console.error('Errore modifica appuntamento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('id');

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID mancante' }, { status: 400 });
    }

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Errore cancellazione appuntamento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
