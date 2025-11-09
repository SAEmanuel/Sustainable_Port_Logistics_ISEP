namespace SEM5_PI_WEBAPI.utils;

public interface IEmailSender
{
    Task SendEmailAsync(string email, string subject, string message);
}