using System.Net;
using System.Net.Mail;

namespace SEM5_PI_WEBAPI.utils;

public class EmailSender(IConfiguration config) : IEmailSender
{
    private readonly IConfiguration _config = config;

    public Task SendEmailAsync(string email, string subject, string message)
    {
        var fromEmail = _config["EmailSettings:FromEmail"];
        var apiKey = _config["EmailSettings:Password"]; 
        var smtpServer = _config["EmailSettings:SmtpServer"] ?? "smtp.sendgrid.net";
        var port = int.Parse(_config["EmailSettings:Port"] ?? "587");

        var client = new SmtpClient(smtpServer, port)
        {
            EnableSsl = true,
            Credentials = new NetworkCredential("apikey", apiKey)
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(fromEmail!, "No Reply"),
            Subject = subject,
            Body = message,
            IsBodyHtml = true
        };

        mailMessage.To.Add(email);

        return client.SendMailAsync(mailMessage);
    }
}