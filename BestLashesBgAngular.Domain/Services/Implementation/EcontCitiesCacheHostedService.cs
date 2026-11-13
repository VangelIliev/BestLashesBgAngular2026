using BestLashesBgAngular.Domain.Models.Econt;
using BestLashesBgAngular.Domain.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BestLashesBgAngular.Domain.Services.Implementation
{
    public class EcontCitiesCacheHostedService : BackgroundService
    {
        public const string CitiesCacheKey = "Econt_Cities";

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IMemoryCache _cache;
        private readonly ILogger<EcontCitiesCacheHostedService> _logger;
        private static readonly TimeSpan RefreshTime = new(6, 0, 0);

        public EcontCitiesCacheHostedService(
            IServiceScopeFactory scopeFactory,
            IMemoryCache cache,
            ILogger<EcontCitiesCacheHostedService> logger)
        {
            _scopeFactory = scopeFactory;
            _cache = cache;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await RefreshCitiesAsync(stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                var delay = GetDelayUntilNextRun();

                try
                {
                    await Task.Delay(delay, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break;
                }

                await RefreshCitiesAsync(stoppingToken);
            }
        }

        private static TimeSpan GetDelayUntilNextRun()
        {
            var now = DateTime.Now;
            var nextRun = now.Date.Add(RefreshTime);

            if (nextRun <= now)
            {
                nextRun = nextRun.AddDays(1);
            }

            return nextRun - now;
        }

        private async Task RefreshCitiesAsync(CancellationToken cancellationToken)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var econtService = scope.ServiceProvider.GetRequiredService<IEcontService>();

                var cities = (await econtService.GetCitiesAsync()).ToList();

                _cache.Set(CitiesCacheKey, cities, new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(25)
                });

                _logger.LogInformation("Cached {Count} Econt cities.", cities.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to refresh Econt cities cache.");
            }
        }
    }
}
