using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.ValueObjects;

[Owned]
public class Location : IValueObject
{
    private const double EarthRadiusKm = 6371.0;

    public double Longitude { get; private set; }
    public double Latitude { get; private set; }

    protected Location() {}

    public Location(double longitude, double latitude)
    {
        Longitude = longitude;
        Latitude = latitude;
    }

    public double CalculateDistanceTo(Location otherLocation)
    {
        double lat1Rad = DegreesToRadians(Latitude);
        double lon1Rad = DegreesToRadians(Longitude);
        double lat2Rad = DegreesToRadians(otherLocation.Latitude);
        double lon2Rad = DegreesToRadians(otherLocation.Longitude);

        double dLat = lat2Rad - lat1Rad;
        double dLon = lon2Rad - lon1Rad;

        double a = Math.Pow(Math.Sin(dLat / 2), 2) +
                   Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                   Math.Pow(Math.Sin(dLon / 2), 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusKm * c;
    }

    private static double DegreesToRadians(double degrees)
    {
        return degrees * Math.PI / 180.0;
    }
}