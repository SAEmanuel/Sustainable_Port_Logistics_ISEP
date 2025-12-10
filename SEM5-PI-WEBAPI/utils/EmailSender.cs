namespace SEM5_PI_WEBAPI.utils;

using SendGrid;
using SendGrid.Helpers.Mail;

public class EmailSender : IEmailSender
{
    private readonly IConfiguration _config;

    public EmailSender(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendEmailAsync(string email, string subject, string message)
    {
        var apiKey = _config["EmailSettings:ApiKey"];
        var client = new SendGridClient(apiKey);

        var from = new EmailAddress(_config["EmailSettings:FromEmail"], "No Reply");
        var to = new EmailAddress(email);

        var msg = MailHelper.CreateSingleEmail(from, to, subject, null, message);

        var response = await client.SendEmailAsync(msg);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Body.ReadAsStringAsync();
            throw new Exception($"SendGrid send error: {response.StatusCode} - {body}");
        }
    }
}