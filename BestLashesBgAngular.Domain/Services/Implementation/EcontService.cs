using BestLashesBgAngular.Domain.Models.Econt;
using BestLashesBgAngular.Domain.Services.Interfaces;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace BestLashesBgAngular.Domain.Services.Implementation
{
    public class EcontService : IEcontService
    {
        public const string HttpClientName = "EcontClient";
        private const string EcontApiBaseUrl = "https://ee.econt.com/services/";

        private static readonly JsonSerializerOptions SerializerOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        private readonly IHttpClientFactory _httpClientFactory;

        public EcontService(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        public async Task<IEnumerable<City>> GetCitiesAsync(string countryCode = "BGR")
        {
            var client = CreateClient();

            var response = await client.PostAsJsonAsync(
                "Nomenclatures/NomenclaturesService.getCities.json",
                new { countryCode },
                SerializerOptions);

            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<GetCitiesResponse>(SerializerOptions);

            var cities = result?.Cities?.Select(c => new City
            {
                Id = c.Id,
                Name = c.Name ?? string.Empty,
                NameEn = c.NameEn,
                PostCode = c.PostCode
            }) ?? Enumerable.Empty<City>();

            var cityIdsWithOffices = await GetCityIdsWithOfficesAsync();

            return cities.Where(c => cityIdsWithOffices.Contains(c.Id));
        }

        private async Task<HashSet<int>> GetCityIdsWithOfficesAsync()
        {
            var client = CreateClient();

            var response = await client.PostAsJsonAsync(
                "Nomenclatures/NomenclaturesService.getOffices.json",
                new { countryCode = "BGR" },
                SerializerOptions);

            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<GetOfficesResponse>(SerializerOptions);

            return result?.Offices?
                .Where(o => o.Address?.City?.Id is > 0)
                .Select(o => o.Address!.City!.Id)
                .ToHashSet() ?? new HashSet<int>();
        }

        public async Task<IEnumerable<Office>> GetOfficesAsync(string cityName)
        {
            var client = CreateClient();

            var response = await client.PostAsJsonAsync(
                "Nomenclatures/NomenclaturesService.getOffices.json",
                new { countryCode = "BGR", cityName },
                SerializerOptions);

            response.EnsureSuccessStatusCode();

            return await MapOfficesAsync(response);
        }

        public async Task<IEnumerable<Office>> GetOfficesByCityIdAsync(int cityId)
        {
            var client = CreateClient();

            var response = await client.PostAsJsonAsync(
                "Nomenclatures/NomenclaturesService.getOffices.json",
                new { countryCode = "BGR", cityID = cityId },
                SerializerOptions);

            response.EnsureSuccessStatusCode();

            return await MapOfficesAsync(response);
        }

        private async Task<IEnumerable<Office>> MapOfficesAsync(HttpResponseMessage response)
        {
            var result = await response.Content.ReadFromJsonAsync<GetOfficesResponse>(SerializerOptions);

            return result?.Offices?.Select(o => new Office
            {
                Id = o.Id,
                Code = o.Code,
                Name = o.Name ?? string.Empty,
                NameEn = o.NameEn,
                Address = new Address
                {
                    FullAddress = o.Address?.FullAddress,
                    City = new City
                    {
                        Id = o.Address?.City?.Id ?? 0,
                        Name = o.Address?.City?.Name ?? string.Empty,
                        NameEn = o.Address?.City?.NameEn,
                        PostCode = o.Address?.City?.PostCode
                    }
                }
            }) ?? Enumerable.Empty<Office>();
        }

        private HttpClient CreateClient()
        {
            var client = _httpClientFactory.CreateClient(HttpClientName);
            if (client.BaseAddress is null)
            {
                client.BaseAddress = new Uri(EcontApiBaseUrl);
            }

            return client;
        }

        private sealed class GetCitiesResponse
        {
            [JsonPropertyName("cities")]
            public List<CityDto>? Cities { get; set; }
        }

        private sealed class GetOfficesResponse
        {
            [JsonPropertyName("offices")]
            public List<OfficeDto>? Offices { get; set; }
        }

        private sealed class CityDto
        {
            [JsonPropertyName("id")]
            public int Id { get; set; }

            [JsonPropertyName("name")]
            public string? Name { get; set; }

            [JsonPropertyName("nameEn")]
            public string? NameEn { get; set; }

            [JsonPropertyName("postCode")]
            public string? PostCode { get; set; }
        }

        private sealed class OfficeDto
        {
            [JsonPropertyName("id")]
            public int Id { get; set; }

            [JsonPropertyName("code")]
            public string? Code { get; set; }

            [JsonPropertyName("name")]
            public string? Name { get; set; }

            [JsonPropertyName("nameEn")]
            public string? NameEn { get; set; }

            [JsonPropertyName("address")]
            public AddressDto? Address { get; set; }
        }

        private sealed class AddressDto
        {
            [JsonPropertyName("fullAddress")]
            public string? FullAddress { get; set; }

            [JsonPropertyName("city")]
            public CityDto? City { get; set; }
        }
    }
}
