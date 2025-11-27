import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const therapist_user_id = searchParams.get('therapist_user_id');
    
    if (!therapist_user_id) {
      return NextResponse.json({ error: 'Therapist user ID richiesto' }, { status: 400 });
    }

    // Query per ottenere fatture con dettagli paziente
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        patients!invoices_patient_id_fkey (
          display_name,
          email,
          fiscal_code,
          address
        ),
        invoice_items (
          id,
          session_date,
          description,
          session_type,
          rate,
          amount
        )
      `)
      .eq('therapist_user_id', therapist_user_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Trasforma i dati nel formato atteso dal frontend
    const transformedInvoices = invoices?.map(invoice => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      patient_name: invoice.patients?.display_name || 'Nome mancante',
      patient_email: invoice.patients?.email || '',
      patient_fiscal_code: invoice.patients?.fiscal_code || '',
      patient_address: invoice.patients?.address || '',
      total_amount: parseFloat(invoice.total_amount || 0),
      enpap_amount: parseFloat(invoice.enpap_amount || 0),
      bollo_amount: parseFloat(invoice.bollo_amount || 2),
      subtotal: parseFloat(invoice.subtotal || 0),
      enpap_rate: invoice.enpap_rate || 2,
      status: invoice.status,
      due_date: invoice.due_date,
      created_at: invoice.created_at,
      period_start: invoice.period_start,
      period_end: invoice.period_end,
      notes: invoice.notes,
      sessions_count: invoice.invoice_items?.length || 0,
      items: invoice.invoice_items || []
    }));

    return NextResponse.json({ invoices: transformedInvoices });

  } catch (error: any) {
    console.error('Errore GET invoices:', error);
    return NextResponse.json(
      { error: 'Errore caricamento fatture: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      therapist_user_id,
      patient_id,
      period_start,
      period_end,
      notes,
      enpap_rate = 2,
      bollo_amount = 2.00,
      items = []
    } = body;

    // Validazione input
    if (!therapist_user_id || !patient_id || !items.length) {
      return NextResponse.json({ 
        error: 'Dati mancanti: therapist_user_id, patient_id e items sono obbligatori' 
      }, { status: 400 });
    }

    // Calcola totali
    const subtotal = items.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);
    const enpap_amount = (subtotal * enpap_rate) / 100;
    const total_amount = subtotal + enpap_amount + bollo_amount;

    // Genera numero fattura
    const { data: invoiceNumber, error: numberError } = await supabase
      .rpc('generate_invoice_number');
    
    if (numberError) {
      throw new Error('Errore generazione numero fattura: ' + numberError.message);
    }

    // Calcola data scadenza (30 giorni)
    const due_date = new Date();
    due_date.setDate(due_date.getDate() + 30);

    // Crea fattura
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        therapist_user_id,
        patient_id,
        invoice_number: invoiceNumber,
        total_amount,
        enpap_amount,
        bollo_amount,
        subtotal,
        enpap_rate,
        status: 'draft',
        due_date: due_date.toISOString().split('T')[0],
        period_start,
        period_end,
        notes
      })
      .select()
      .single();

    if (invoiceError) {
      throw invoiceError;
    }

    // Crea righe fattura
    const invoiceItems = items.map((item: any) => ({
      invoice_id: invoice.id,
      session_date: item.date,
      description: item.description,
      session_type: item.session_type,
      rate: parseFloat(item.rate),
      amount: parseFloat(item.amount)
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) {
      // Rollback: elimina fattura se inserimento righe fallisce
      await supabase.from('invoices').delete().eq('id', invoice.id);
      throw itemsError;
    }

    return NextResponse.json({
      success: true,
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      message: 'Fattura creata con successo'
    });

  } catch (error: any) {
    console.error('Errore POST invoice:', error);
    return NextResponse.json(
      { error: 'Errore creazione fattura: ' + error.message },
      { status: 500 }
    );
  }
}
