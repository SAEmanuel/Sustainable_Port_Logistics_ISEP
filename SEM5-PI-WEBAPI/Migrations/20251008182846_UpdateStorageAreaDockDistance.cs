using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEM5_PI_WEBAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateStorageAreaDockDistance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_StorageArea",
                table: "StorageArea");

            migrationBuilder.RenameTable(
                name: "StorageArea",
                newName: "StorageAreas");

            migrationBuilder.AddColumn<int>(
                name: "CurrentCapacityTeu",
                table: "StorageAreas",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "StorageAreas",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxBays",
                table: "StorageAreas",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxRows",
                table: "StorageAreas",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxTiers",
                table: "StorageAreas",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "StorageAreas",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "StorageAreas",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_StorageAreas",
                table: "StorageAreas",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "CargoManifest",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Code = table.Column<string>(type: "TEXT", maxLength: 8, nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    SubmittedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CargoManifest", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StorageAreaDockDistance",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    DockCode = table.Column<string>(type: "TEXT", nullable: false),
                    DistanceKm = table.Column<float>(type: "REAL", nullable: false),
                    StorageAreaId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StorageAreaDockDistance", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StorageAreaDockDistance_StorageAreas_StorageAreaId",
                        column: x => x.StorageAreaId,
                        principalTable: "StorageAreas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CargoManifestEntry",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    ContainerId = table.Column<string>(type: "TEXT", nullable: false),
                    Bay = table.Column<int>(type: "INTEGER", nullable: false),
                    Row = table.Column<int>(type: "INTEGER", nullable: false),
                    Tier = table.Column<int>(type: "INTEGER", nullable: false),
                    CargoManifestId = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CargoManifestEntry", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CargoManifestEntry_CargoManifest_CargoManifestId",
                        column: x => x.CargoManifestId,
                        principalTable: "CargoManifest",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CargoManifestEntry_Containers_ContainerId",
                        column: x => x.ContainerId,
                        principalTable: "Containers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CargoManifestEntry_CargoManifestId",
                table: "CargoManifestEntry",
                column: "CargoManifestId");

            migrationBuilder.CreateIndex(
                name: "IX_CargoManifestEntry_ContainerId",
                table: "CargoManifestEntry",
                column: "ContainerId");

            migrationBuilder.CreateIndex(
                name: "IX_StorageAreaDockDistance_StorageAreaId",
                table: "StorageAreaDockDistance",
                column: "StorageAreaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CargoManifestEntry");

            migrationBuilder.DropTable(
                name: "StorageAreaDockDistance");

            migrationBuilder.DropTable(
                name: "CargoManifest");

            migrationBuilder.DropPrimaryKey(
                name: "PK_StorageAreas",
                table: "StorageAreas");

            migrationBuilder.DropColumn(
                name: "CurrentCapacityTeu",
                table: "StorageAreas");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "StorageAreas");

            migrationBuilder.DropColumn(
                name: "MaxBays",
                table: "StorageAreas");

            migrationBuilder.DropColumn(
                name: "MaxRows",
                table: "StorageAreas");

            migrationBuilder.DropColumn(
                name: "MaxTiers",
                table: "StorageAreas");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "StorageAreas");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "StorageAreas");

            migrationBuilder.RenameTable(
                name: "StorageAreas",
                newName: "StorageArea");

            migrationBuilder.AddPrimaryKey(
                name: "PK_StorageArea",
                table: "StorageArea",
                column: "Id");
        }
    }
}
