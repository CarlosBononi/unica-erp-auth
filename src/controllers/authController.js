const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, fullname } = req.body;

    if (!email || !password || !fullname) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Usuário já existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{ email, password: hashedPassword, fullname, created_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) throw error;

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
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

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
};

// Logout user
const logout = (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token obrigatório' });
    }

    const { data: tokenData, error } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token', refreshToken)
      .single();

    if (error || !tokenData) {
      return res.status(403).json({ error: 'Refresh token inválido' });
    }

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
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email obrigatório' });
    }

    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    await supabase
      .from('password_reset_tokens')
      .insert([{ email, token: resetToken }]);

    res.json({
      message: 'Verifique seu email para recuperar a senha',
      resetToken
    });
  } catch (error) {
    console.error('Erro ao recuperar senha:', error);
    res.status(500).json({ error: error.message });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (!decoded.email) {
      return res.status(403).json({ error: 'Token inválido' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', decoded.email);

    if (error) throw error;

    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token', resetToken);

    res.json({ message: 'Senha resetada com sucesso' });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ error: error.message });
  }
};

// Validate credentials
const validateCredentials = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      return res.status(401).json({ valid: false });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    res.json({ valid: validPassword });
  } catch (error) {
    console.error('Erro ao validar:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get user profile
const getProfile = async (req, res) => {
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
};

// Get 2FA status
const get2FA = async (req, res) => {
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
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  validateCredentials,
  getProfile,
  get2FA
};
