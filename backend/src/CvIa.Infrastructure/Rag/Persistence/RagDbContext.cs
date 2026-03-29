using CvIa.Domain.Rag;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Pgvector;

namespace CvIa.Infrastructure.Rag.Persistence;

public sealed class RagDbContext(DbContextOptions<RagDbContext> options) : DbContext(options)
{
    public DbSet<RagContentChunk> ContentChunks => Set<RagContentChunk>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("vector");

        modelBuilder.Entity<RagContentChunk>(entity =>
        {
            entity.ToTable("content_chunk");
            entity.HasKey(x => x.Id);

            entity.Property(x => x.SourceId).HasColumnName("source_id").HasMaxLength(128).IsRequired();
            entity.Property(x => x.DocumentKey).HasColumnName("document_key").HasMaxLength(512).IsRequired();
            entity.Property(x => x.SectionId).HasColumnName("section_id").HasMaxLength(128);
            entity.Property(x => x.Lang).HasColumnName("lang").HasMaxLength(8);
            entity.Property(x => x.ChunkIndex).HasColumnName("chunk_index").IsRequired();
            entity.Property(x => x.Text).HasColumnName("text").IsRequired();
            entity.Property(x => x.Embedding)
                .HasColumnName("embedding")
                .HasColumnType("vector(1536)")
                .IsRequired()
                .HasConversion(
                    floats => new Vector(floats),
                    vector => vector.ToArray())
                .Metadata.SetValueComparer(
                    new ValueComparer<float[]>(
                        (a, b) => ReferenceEquals(a, b) || (a != null && b != null && a.SequenceEqual(b)),
                        v => v.Aggregate(0, (h, x) => HashCode.Combine(h, x.GetHashCode())),
                        v => v.ToArray()));
            entity.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc").IsRequired();

            entity.HasIndex(x => new { x.SourceId, x.Lang });
            entity.HasIndex(x => new { x.SourceId, x.DocumentKey, x.ChunkIndex }).IsUnique();
        });
    }
}
