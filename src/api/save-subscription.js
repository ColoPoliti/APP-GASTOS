// api/save-subscription.js
import { createClient } from '@supabase/supabase-js';

// Inicializamos Supabase con las credenciales de servicio o del cliente
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { subscription, userId, hogarId } = req.body;

    if (!subscription || !userId) {
      return res.status(400).json({ error: 'Faltan datos obligatorios (subscription o userId)' });
    }

    // Guardamos o actualizamos la suscripción en la tabla
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { 
          user_id: userId, 
          hogar_id: hogarId || 'default', 
          subscription: subscription 
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('Error de Supabase:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, message: 'Suscripción guardada con éxito' });
  } catch (err) {
    console.error('Error en el servidor:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}