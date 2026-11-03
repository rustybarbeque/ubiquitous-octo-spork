using Macrocenter.Api.Dtos;
using Macrocenter.Api.Dtos.Discounts;
using Macrocenter.Domain.Entities;
using Macrocenter.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Macrocenter.Api.Services;

/// <summary>
/// Administrative management of discount codes. Whether a code actually
/// discounts a given cart is decided by <see cref="PricingService"/>, not here.
/// </summary>
public sealed class DiscountCodeService(MacrocenterDbContext db)
{
    /// <summary>Searches, sorts, and pages the discount codes.</summary>
    public async Task<PagedResult<DiscountCodeDto>> SearchAsync(
        DiscountCodeQuery query,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var codes = db.DiscountCodes.AsNoTracking();

        if (query.Search is { } search)
        {
            codes = codes.Where(d =>
                EF.Functions.ILike(d.Code, $"%{search}%")
                || (d.Description != null && EF.Functions.ILike(d.Description, $"%{search}%")));
        }

        if (query.ActiveOnly)
        {
            codes = codes.Where(d =>
                d.IsActive
                && (d.StartsAt == null || d.StartsAt <= now)
                && (d.EndsAt == null || d.EndsAt >= now));
        }

        codes = query.Sort switch
        {
            "code-asc" => codes.OrderBy(d => d.Code),
            "code-desc" => codes.OrderByDescending(d => d.Code),
            "oldest" => codes.OrderBy(d => d.CreatedAt),
            _ => codes.OrderByDescending(d => d.CreatedAt),
        };

        var total = await codes.CountAsync(cancellationToken);

        var page = await codes
            .Skip(query.Skip)
            .Take(query.NormalizedPageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<DiscountCodeDto>(
            page.Select(d => d.ToDto(now)).ToList(),
            query.NormalizedPage,
            query.NormalizedPageSize,
            total);
    }

    /// <summary>One discount code by id, or null.</summary>
    public async Task<DiscountCodeDto?> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        var code = await db.DiscountCodes
            .AsNoTracking()
            .SingleOrDefaultAsync(d => d.Id == id, cancellationToken);

        return code?.ToDto(DateTimeOffset.UtcNow);
    }

    /// <summary>Creates a discount code.</summary>
    public async Task<ServiceResult<DiscountCodeDto>> CreateAsync(
        SaveDiscountCodeRequest request,
        CancellationToken cancellationToken)
    {
        var code = CartService.NormalizeCode(request.Code);

        if (await db.DiscountCodes.AnyAsync(d => d.Code == code, cancellationToken))
        {
            return ServiceResult<DiscountCodeDto>.Conflict(
                $"A discount code named {code} already exists.");
        }

        var now = DateTimeOffset.UtcNow;

        var entity = new DiscountCode
        {
            Id = Guid.CreateVersion7(),
            Code = code,
            Description = request.Description?.Trim(),
            Kind = request.Kind,
            Value = request.Value,
            MinimumSubtotal = request.MinimumSubtotal,
            StartsAt = request.StartsAt,
            EndsAt = request.EndsAt,
            IsActive = request.IsActive,
            CreatedAt = now,
            UpdatedAt = now,
        };

        db.DiscountCodes.Add(entity);
        await db.SaveChangesAsync(cancellationToken);

        return ServiceResult<DiscountCodeDto>.Ok(entity.ToDto(now));
    }

    /// <summary>
    /// Updates a discount code. Carts that already have it applied recompute
    /// against the new values on their next read.
    /// </summary>
    public async Task<ServiceResult<DiscountCodeDto>> UpdateAsync(
        Guid id,
        SaveDiscountCodeRequest request,
        CancellationToken cancellationToken)
    {
        var entity = await db.DiscountCodes
            .SingleOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (entity is null)
        {
            return ServiceResult<DiscountCodeDto>.NotFound("That discount code does not exist.");
        }

        var code = CartService.NormalizeCode(request.Code);

        if (await db.DiscountCodes.AnyAsync(d => d.Code == code && d.Id != id, cancellationToken))
        {
            return ServiceResult<DiscountCodeDto>.Conflict(
                $"A discount code named {code} already exists.");
        }

        var now = DateTimeOffset.UtcNow;

        entity.Code = code;
        entity.Description = request.Description?.Trim();
        entity.Kind = request.Kind;
        entity.Value = request.Value;
        entity.MinimumSubtotal = request.MinimumSubtotal;
        entity.StartsAt = request.StartsAt;
        entity.EndsAt = request.EndsAt;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = now;

        await db.SaveChangesAsync(cancellationToken);

        return ServiceResult<DiscountCodeDto>.Ok(entity.ToDto(now));
    }

    /// <summary>
    /// Deletes a discount code. Carts referencing it simply lose their
    /// discount; placed orders are untouched, because they hold only a copy of
    /// the code text.
    /// </summary>
    public async Task<ServiceResult<bool>> DeleteAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var entity = await db.DiscountCodes
            .SingleOrDefaultAsync(d => d.Id == id, cancellationToken);

        if (entity is null)
        {
            return ServiceResult<bool>.NotFound("That discount code does not exist.");
        }

        db.DiscountCodes.Remove(entity);
        await db.SaveChangesAsync(cancellationToken);

        return ServiceResult<bool>.Ok(true);
    }
}
