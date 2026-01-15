require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// POST /auth/register - Registrar novo usuário
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, fullname } = req.body;

    if (!email || !password || !fullname) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Usuário já existe' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir usuário
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password: hashedPassword,
          fullname,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Gerar JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: { id: newUser.id, email: newUser.email, fullname: newUser.fullname },
      token
    });
  } catch (error) {
    console.error('Erro ao registrar:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /auth/login - Login de usuário
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Gerar JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      user: { id: user.id, email: user.email, fullname: user.fullname },
      token
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /auth/logout - Logout
app.post('/auth/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

// GET /auth/refresh-token - Renovar token JWT
app.post('/auth/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token obrigatório' });
    }

    // Verificar refresh token no banco de dados
    const { data: tokenData, error } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token', refreshToken)
      .single();

    if (error || !tokenData) {
      return res.status(403).json({ error: 'Refresh token inválido' });
    }

    // Gerar novo JWT
    const newToken = jwt.sign(
      { id: tokenData.user_id, email: tokenData.user_email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token: newToken });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /auth/forgot-password - Recuperar senha
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email obrigatório' });
    }

    // Gerar token de reset
    const resetToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Armazenar token no banco de dados
    await supabase
      .from('password_reset_tokens')
      .insert([{ email, token: resetToken }]);

    // TODO: Enviar email com link de reset
    res.json({
      message: 'Verifique seu email para recuperar a senha',
      resetToken // Em produção, não retornar token
    });
  } catch (error) {
    console.error('Erro ao recuperar senha:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /auth/reset-password - Resetar senha
app.post('/auth/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    // Verificar token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (!decoded.email) {
      return res.status(403).json({ error: 'Token inválido' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha do usuário
    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', decoded.email);

    if (error) throw error;

    // Deletar token de reset
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token', resetToken);

    res.json({ message: 'Senha resetada com sucesso' });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /auth/validate-credentials - Validar credenciais
app.post('/auth/validate-credentials', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      return res.status(401).json({ valid: false });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);
    res.json({ valid: validPassword });
  } catch (error) {
    console.error('Erro ao validar:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /auth/profile - Obter perfil do usuário
app.get('/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, fullname, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /auth/2fa - Obter status de autenticação de dois fatores
app.get('/auth/2fa', authenticateToken, async (req, res) => {
  try {
    const { data: twoFactorData, error } = await supabase
      .from('two_factor_auth')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json({ enabled: !!twoFactorData });
  } catch (error) {
    console.error('Erro ao obter 2FA:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({ message: 'ÚNICA ERP - Authentication Module', version: '1.0.0' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
