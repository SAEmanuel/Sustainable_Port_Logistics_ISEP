using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SEM5_PI_WEBAPI.Domain.Users;

namespace SEM5_PI_WEBAPI.Infraestructure.Users
{
    public class UserEntityTypeConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.HasKey(u => u.Id);
            
            builder.Property(u => u.Auth0UserId)
                .IsRequired(false)
                .HasMaxLength(240);
            
            builder.Property(u => u.Name)
                .IsRequired(false)
                .HasMaxLength(150);
            
            builder.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(240);
            
            builder.Property(u => u.IsActive)
                .IsRequired();
            
            builder.Property(u => u.Eliminated)
                .IsRequired();
            
            builder.Property(u => u.Role)
                .IsRequired(false)
                .HasConversion<string>()
                .HasMaxLength(30);

           
            builder.Property(u => u.Picture)
                .IsRequired(false)
                .HasColumnType("bytea"); 

            
            builder.ToTable("Users");
        }
    }
}