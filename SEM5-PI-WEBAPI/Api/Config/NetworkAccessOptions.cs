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
        /// Lista “inline” de CIDRs/IPs. Pode servir de default/fallback.
        /// </summary>
        public string[] AllowedCidrs { get; set; } = Array.Empty<string>();

        /// <summary>
        /// Caminho para o ficheiro de endpoints permitidos.
        /// Pode ser relativo ao ContentRoot (por ex. "Config/allowed-endpoints.txt").
        /// </summary>
        public string? AllowedCidrsFile { get; set; }
    }
}