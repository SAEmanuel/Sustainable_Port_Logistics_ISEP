namespace SEM5_PI_WEBAPI.Api.Config
{
    public class NetworkAccessOptions
    {
        /// <summary>
        /// Environments em que a restrição está ativa (ex: Development, Staging).
        /// Tem de bater certo com ASPNETCORE_ENVIRONMENT.
        /// </summary>
        public string[] EnforceForEnvironments { get; set; } = Array.Empty<string>();

        /// <summary>
        /// Lista de IPs/subredes permitidas em formato "IP" ou "IP/Prefix" (CIDR).
        /// Ex: "10.8.211.0/30", "10.9.0.0/16", "127.0.0.1".
        /// </summary>
        public string[] AllowedCidrs { get; set; } = Array.Empty<string>();
    }
}