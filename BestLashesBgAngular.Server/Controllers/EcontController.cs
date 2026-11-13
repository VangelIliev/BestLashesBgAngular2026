using BestLashesBgAngular.Domain.Models.Econt;
using BestLashesBgAngular.Domain.Services.Implementation;
using BestLashesBgAngular.Domain.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace BestLashesBgAngular.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EcontController : ControllerBase
    {
        private readonly IEcontService _econtService;
        private readonly IMemoryCache _cache;
        private readonly ILogger<EcontController> _logger;

        public EcontController(IEcontService econtService, IMemoryCache cache, ILogger<EcontController> logger)
        {
            _econtService = econtService;
            _cache = cache;
            _logger = logger;
        }

        [HttpGet("cities")]
        public async Task<ActionResult<IEnumerable<City>>> GetCities()
        {
            if (_cache.TryGetValue(EcontCitiesCacheHostedService.CitiesCacheKey, out List<City>? cities) && cities is not null)
            {
                return Ok(cities);
            }

            try
            {
                var freshCities = (await _econtService.GetCitiesAsync()).ToList();

                _cache.Set(EcontCitiesCacheHostedService.CitiesCacheKey, freshCities, new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(25)
                });

                return Ok(freshCities);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve Econt cities.");
                return StatusCode(StatusCodes.Status502BadGateway, "Неуспешно зареждане на градовете от Еконт.");
            }
        }

        [HttpGet("offices/{cityId:int}")]
        public async Task<ActionResult<IEnumerable<Office>>> GetOffices(int cityId)
        {
            try
            {
                var offices = await _econtService.GetOfficesByCityIdAsync(cityId);
                return Ok(offices);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve Econt offices for city {CityId}.", cityId);
                return StatusCode(StatusCodes.Status502BadGateway, "Неуспешно зареждане на офисите от Еконт.");
            }
        }
    }
}
