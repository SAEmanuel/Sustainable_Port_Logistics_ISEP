using SEM5_PI_DecisionEngineAPI.Services;

var builder = WebApplication.CreateBuilder(args);



builder.Services.AddControllers();
builder.Services.AddHttpClient<PrologClient>();
builder.Services.AddHttpClient<DockServiceClient>();
builder.Services.AddHttpClient<PhysicalResourceServiceClient>();
builder.Services.AddHttpClient<StaffMemberServiceClient>();
builder.Services.AddHttpClient<VesselServiceClient>();
builder.Services.AddHttpClient<VesselVisitNotificationServiceClient>();

builder.Services.AddOpenApi();

var app = builder.Build();


if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();