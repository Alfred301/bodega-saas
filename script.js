// Supabase Client
const supabaseUrl = 'https://pxdiltdujcrqfidddkwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4ZGlsdGR1amNycWZpZGRka3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDg2MzIsImV4cCI6MjA3MTc4NDYzMn0.VehDKQMWq6gVyV6Ksbi65r5-pjH3WlI8q-JFCGtshOk';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

let currentBodegaId = null;

// Login
async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Error: " + error.message);
    return;
  }

  const user = data.user;
  const {  usuario, error: uError } = await supabase
    .from('usuarios')
    .select('bodega_id')
    .eq('id', user.id)
    .single();

  if (uError) {
    alert("No perteneces a ninguna bodega.");
    return;
  }

  currentBodegaId = usuario.bodega_id;
  showScreen('dashboard-screen');
  loadDashboard();
}

// Cargar dashboard
async function loadDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const {  ventas, error } = await supabase
    .from('ventas')
    .select('total')
    .eq('bodega_id', currentBodegaId)
    .gte('fecha', today);

  const {  productos, error: pError } = await supabase
    .from('productos')
    .select('id', { count: 'exact' })
    .eq('bodega_id', currentBodegaId);

  document.getElementById('ventas-hoy').textContent = `$${ventas.reduce((a,v) => a + v.total, 0).toFixed(2)}`;
  document.getElementById('total-productos').textContent = productos.length;
}

// Mostrar pantalla
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// Mostrar modal para producto
function showAddProduct() {
  document.getElementById('modal-title').textContent = "Nuevo Producto";
  document.getElementById('prod-nombre').value = '';
  document.getElementById('prod-precio').value = '';
  document.getElementById('prod-stock').value = '';
  document.getElementById('prod-foto').value = '';
  document.getElementById('product-modal').style.display = 'flex';
}

// Guardar producto
async function saveProduct() {
  const nombre = document.getElementById('prod-nombre').value;
  const precio = parseFloat(document.getElementById('prod-precio').value);
  const stock = parseInt(document.getElementById('prod-stock').value);
  const fotoInput = document.getElementById('prod-foto');

  let fotoUrl = null;

  if (fotoInput.files.length > 0) {
    const file = fotoInput.files[0];
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('fotos-productos')
      .upload(fileName, file);

    if (uploadError) {
      alert("Error al subir foto");
      return;
    }

    fotoUrl = `https://TU-PROYECTO.supabase.co/storage/v1/object/public/fotos-productos/${fileName}`;
  }

  const { error } = await supabase
    .from('productos')
    .insert([{ 
      bodega_id: currentBodegaId,
      nombre, 
      precio, 
      stock, 
      foto_url: fotoUrl 
    }]);

  if (error) {
    alert("Error: " + error.message);
  } else {
    closeModal();
    loadProductos();
  }
}

// Cerrar modal
function closeModal() {
  document.getElementById('product-modal').style.display = 'none';
}

// Logout
async function logout() {
  await supabase.auth.signOut();
  showScreen('login-screen');
}

// Autenticación automática
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    // Podrías redirigir directamente si ya está autenticado
  }
});