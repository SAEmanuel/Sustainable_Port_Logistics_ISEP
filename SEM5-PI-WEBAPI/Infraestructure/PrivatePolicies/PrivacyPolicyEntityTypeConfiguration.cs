using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.PrivacyPolicies;

namespace SEM5_PI_WEBAPI.Infraestructure.PrivatePolicies;

public class PrivacyPolicyEntityTypeConfiguration: IEntityTypeConfiguration<PrivacyPolicy>
{
    public void Configure(EntityTypeBuilder<PrivacyPolicy> builder)
    {

    } 
}