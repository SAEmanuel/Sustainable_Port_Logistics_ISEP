using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEM5_PI_WEBAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddCapacityToVesselType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<float>(
                name: "Capacity",
                table: "VesselType",
                type: "REAL",
                nullable: false,
                defaultValue: 0f);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "VesselType",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxBays",
                table: "VesselType",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxRows",
                table: "VesselType",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxTiers",
                table: "VesselType",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "VesselType",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "Qualifications",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Capacity",
                table: "VesselType");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "VesselType");

            migrationBuilder.DropColumn(
                name: "MaxBays",
                table: "VesselType");

            migrationBuilder.DropColumn(
                name: "MaxRows",
                table: "VesselType");

            migrationBuilder.DropColumn(
                name: "MaxTiers",
                table: "VesselType");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "VesselType");

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "Qualifications",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");
        }
    }
}
