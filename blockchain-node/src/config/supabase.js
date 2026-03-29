const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Verificamos que las variables existan para evitar errores
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan las variables de entorno de Supabase (SUPABASE_URL o SUPABASE_KEY).');
}

// Creamos la conexión
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
