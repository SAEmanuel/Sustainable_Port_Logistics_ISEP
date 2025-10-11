using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.VVN.Docs;

public class PdfDocument : IValueObject
{
    public string FileName { get; }
    public byte[] Content { get; }
    public string ContentType { get; } = "application/pdf";

    public PdfDocument(string fileName, byte[] content)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            throw new BusinessRuleValidationException("File name cannot be empty.");
        if (content == null || content.Length == 0)
            throw new BusinessRuleValidationException("Content cannot be empty.");

        FileName = fileName;
        Content = content;
    }

    public override bool Equals(object? obj) =>
        obj is PdfDocument other &&
        FileName == other.FileName &&
        Content.SequenceEqual(other.Content) &&
        ContentType == other.ContentType;

    public override int GetHashCode()
    {
        var hash = new HashCode();
        hash.Add(FileName);
        foreach (var b in Content) hash.Add(b);
        hash.Add(ContentType);
        return hash.ToHashCode();
    }
}