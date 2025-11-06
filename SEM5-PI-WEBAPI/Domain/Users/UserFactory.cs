namespace SEM5_PI_WEBAPI.Domain.Users;

public class UserFactory
{
    public static async Task<User> CreateUser(string auth0UserId, string email, string name , string? pictureUrl = null)
    {
        byte[]? pictureBytes = null;

        if (!string.IsNullOrWhiteSpace(pictureUrl))
        {
            try
            {
                using var httpClient = new HttpClient();
                pictureBytes = await httpClient.GetByteArrayAsync(pictureUrl);
            }
            catch
            {
                pictureBytes = null;
            }
        }

        return new User(auth0UserId, email, name, pictureBytes);
    }
}