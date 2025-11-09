namespace SEM5_PI_WEBAPI.utils.EmailTemplates;

public static class ActivationEmailTemplate
{
    public static string Build(string name, string email)
    {
        var activationLink = $"http://localhost:5173/activate?email={Uri.EscapeDataString(email)}";

        return $@"
<html lang='pt'>
  <body style='font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0;'>
    <div style='max-width:600px; margin:40px auto; background:#ffffff; border-radius:8px; padding:24px; border:1px solid #e0e0e0;'>
      
      <!-- Portuguese section -->
      <h2 style='color:#1d3557;'>Bem-vindo à Gestão Portuária da ThPA</h2>
      <p style='color:#333;'>Olá <strong>{name}</strong>,</p>
      <p style='color:#333;'>
        Para ativar a sua conta, aceda ao link abaixo:
      </p>

      <p style='margin:16px 0; word-break:break-all;'>
        <a href='{activationLink}' target='_blank' style='color:#1a73e8; text-decoration:none;'>
          {activationLink}
        </a>
      </p>

      <p style='color:#333;'>
        Após a ativação, deverá aguardar que o administrador do sistema atribua a sua função (role) antes de poder aceder à plataforma.
      </p>

      <hr style='margin:32px 0; border:none; border-top:2px solid #ddd;' />

      <!-- English section -->
      <h2 style='color:#1d3557;'>Welcome to ThPA Port Management System</h2>
      <p style='color:#333;'>Hello <strong>{name}</strong>,</p>
      <p style='color:#333;'>
        To activate your account, please open the following link:
      </p>

      <p style='margin:16px 0; word-break:break-all;'>
        <a href='{activationLink}' target='_blank' style='color:#1a73e8; text-decoration:none;'>
          {activationLink}
        </a>
      </p>

      <p style='color:#333;'>
        After activation, please wait for the system administrator to assign your role before accessing the platform.
      </p>

      <hr style='margin:32px 0; border:none; border-top:1px solid #eee;' />

      <p style='font-size:0.9rem; color:#666; text-align:center;'>
        Atenciosamente / Best regards,<br/>
        <strong>Equipa de Gestão Portuária da ThPA / ThPA Port Management Team</strong>
      </p>
    </div>
  </body>
</html>";
    }
}