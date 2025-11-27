import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'ID fattura richiesto' }, { status: 400 });
    }

    // Query dettaglio fattura con paziente e righe
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        patients!invoices_patient_id_fkey (
          display_name,
          email,
          fiscal_code,
          address,
          city,
          postal_code,
          province
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
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 });
      }
      throw error;
    }

    // Trasforma nel formato atteso dal frontend
    const transformedInvoice = {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      patient_name: invoice.patients?.display_name || 'Nome mancante',
      patient_email: invoice.patients?.email || '',
      patient_fiscal_code: invoice.patients?.fiscal_code || '',
      patient_address: `${invoice.patients?.address || ''}, ${invoice.patients?.city || ''} ${invoice.patients?.postal_code || ''} (${invoice.patients?.province || ''})`.trim(),
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
      notes: invoice.notes || '',
      items: (invoice.invoice_items || []).map((item: any) => ({
        id: item.id,
        date: item.session_date,
        description: item.description,
        session_type: item.session_type,
        rate: parseFloat(item.rate),
        amount: parseFloat(item.amount)
      }))
    };

    return NextResponse.json({ invoice: transformedInvoice });

  } catch (error: any) {
    console.error('Errore GET invoice detail:', error);
    return NextResponse.json(
      { error: 'Errore caricamento dettaglio fattura: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID fattura richiesto' }, { status: 400 });
    }

    // Validazione status
    const validStatuses = ['draft', 'sent', 'paid', 'overdue'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Status non valido. Valori accettati: ' + validStatuses.join(', ') 
      }, { status: 400 });
    }

    // Prepara dati aggiornamento
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // Aggiorna fattura
    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        status: invoice.status,
        updated_at: invoice.updated_at
      },
      message: 'Fattura aggiornata con successo'
    });

  } catch (error: any) {
    console.error('Errore PUT invoice:', error);
    return NextResponse.json(
      { error: 'Errore aggiornamento fattura: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'ID fattura richiesto' }, { status: 400 });
    }

    // Verifica che la fattura sia in stato draft
    const { data: invoice, error: checkError } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 });
      }
      throw checkError;
    }

    if (invoice.status !== 'draft') {
      return NextResponse.json({ 
        error: 'Puoi eliminare solo fatture in stato bozza' 
      }, { status: 400 });
    }

    // Elimina fattura (le righe vengono eliminate automaticamente tramite CASCADE)
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Fattura eliminata con successo'
    });

  } catch (error: any) {
    console.error('Errore DELETE invoice:', error);
    return NextResponse.json(
      { error: 'Errore eliminazione fattura: ' + error.message },
      { status: 500 }
    );
  }
}
