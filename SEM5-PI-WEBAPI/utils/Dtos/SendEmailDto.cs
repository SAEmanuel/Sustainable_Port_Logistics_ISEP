namespace SEM5_PI_WEBAPI.utils.Dtos;

public class SendEmailDto
{
    public string Receiver { get; set; }
    public string Subject { get; set; }
    public string Message { get; set; }

    public SendEmailDto(string receiver, string subject, string message)
    {
        Receiver = receiver;
        Subject = subject;
        Message = message;
    }
}