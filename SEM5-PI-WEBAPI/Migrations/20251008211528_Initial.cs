using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEM5_PI_WEBAPI.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CargoManifests",
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
                    table.PrimaryKey("PK_CargoManifests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Containers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    IsoCode = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    WeightKg = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Containers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Dock",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Code = table.Column<string>(type: "TEXT", nullable: false),
                    Location = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    LengthM = table.Column<double>(type: "REAL", nullable: false),
                    DepthM = table.Column<double>(type: "REAL", nullable: false),
                    MaxDraftM = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Dock", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Qualifications",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Code = table.Column<string>(type: "TEXT", maxLength: 15, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Qualifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ShippingAgentOrganizations",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Code = table.Column<string>(type: "TEXT", nullable: false),
                    LegalName = table.Column<string>(type: "TEXT", nullable: false),
                    AltName = table.Column<string>(type: "TEXT", nullable: false),
                    Address = table.Column<string>(type: "TEXT", nullable: false),
                    TaxNumber = table.Column<string>(type: "TEXT", nullable: false),
                    Taxnumber_CountryCode = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShippingAgentOrganizations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ShippingAgentRepresentative",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    CitizenId = table.Column<string>(type: "TEXT", nullable: false),
                    Nationality = table.Column<string>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    PhoneNumber = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShippingAgentRepresentative", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StaffMember",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    ShortName = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    MecanographicNumber = table.Column<string>(type: "TEXT", maxLength: 7, nullable: false),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    Phone = table.Column<string>(type: "TEXT", nullable: false),
                    Shift = table.Column<int>(type: "INTEGER", nullable: false),
                    Days = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffMember", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StorageAreas",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxBays = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxRows = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxTiers = table.Column<int>(type: "INTEGER", nullable: false),
                    CurrentCapacityTeu = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StorageAreas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VesselType",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false, defaultValue: "No description"),
                    MaxBays = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxRows = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxTiers = table.Column<int>(type: "INTEGER", nullable: false),
                    Capacity = table.Column<float>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VesselType", x => x.Id);
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
                    CargoManifestId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CargoManifestEntry", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CargoManifestEntry_CargoManifests_CargoManifestId",
                        column: x => x.CargoManifestId,
                        principalTable: "CargoManifests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CargoManifestEntry_Containers_ContainerId",
                        column: x => x.ContainerId,
                        principalTable: "Containers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DockAllowedVesselTypes",
                columns: table => new
                {
                    VesselTypeId = table.Column<string>(type: "TEXT", nullable: false),
                    DockId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DockAllowedVesselTypes", x => new { x.DockId, x.VesselTypeId });
                    table.ForeignKey(
                        name: "FK_DockAllowedVesselTypes_Dock_DockId",
                        column: x => x.DockId,
                        principalTable: "Dock",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StaffMemberQualifications",
                columns: table => new
                {
                    QualificationsId = table.Column<string>(type: "TEXT", nullable: false),
                    StaffMemberId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffMemberQualifications", x => new { x.QualificationsId, x.StaffMemberId });
                    table.ForeignKey(
                        name: "FK_StaffMemberQualifications_Qualifications_QualificationsId",
                        column: x => x.QualificationsId,
                        principalTable: "Qualifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StaffMemberQualifications_StaffMember_StaffMemberId",
                        column: x => x.StaffMemberId,
                        principalTable: "StaffMember",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StorageAreaDockDistance",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    DockCode = table.Column<string>(type: "TEXT", nullable: false),
                    Distance = table.Column<float>(type: "REAL", nullable: false),
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
                name: "Vessel",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    ImoNumber = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Owner = table.Column<string>(type: "TEXT", nullable: false),
                    VesselTypeId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vessel", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Vessel_VesselType_VesselTypeId",
                        column: x => x.VesselTypeId,
                        principalTable: "VesselType",
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
                name: "IX_Dock_Code",
                table: "Dock",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShippingAgentOrganizations_Code",
                table: "ShippingAgentOrganizations",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShippingAgentRepresentative_Name",
                table: "ShippingAgentRepresentative",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StaffMemberQualifications_StaffMemberId",
                table: "StaffMemberQualifications",
                column: "StaffMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_StorageAreaDockDistance_StorageAreaId",
                table: "StorageAreaDockDistance",
                column: "StorageAreaId");

            migrationBuilder.CreateIndex(
                name: "IX_Vessel_VesselTypeId",
                table: "Vessel",
                column: "VesselTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_VesselType_Name",
                table: "VesselType",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CargoManifestEntry");

            migrationBuilder.DropTable(
                name: "DockAllowedVesselTypes");

            migrationBuilder.DropTable(
                name: "ShippingAgentOrganizations");

            migrationBuilder.DropTable(
                name: "ShippingAgentRepresentative");

            migrationBuilder.DropTable(
                name: "StaffMemberQualifications");

            migrationBuilder.DropTable(
                name: "StorageAreaDockDistance");

            migrationBuilder.DropTable(
                name: "Vessel");

            migrationBuilder.DropTable(
                name: "CargoManifests");

            migrationBuilder.DropTable(
                name: "Containers");

            migrationBuilder.DropTable(
                name: "Dock");

            migrationBuilder.DropTable(
                name: "Qualifications");

            migrationBuilder.DropTable(
                name: "StaffMember");

            migrationBuilder.DropTable(
                name: "StorageAreas");

            migrationBuilder.DropTable(
                name: "VesselType");
        }
    }
}
