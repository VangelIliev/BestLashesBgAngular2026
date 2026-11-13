using BestLashesBgAngular.Domain.Models.Econt;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BestLashesBgAngular.Domain.Services.Interfaces
{
    public interface IEcontService
    {
        public Task<IEnumerable<Office>> GetOfficesAsync(string cityName);

        public Task<IEnumerable<Office>> GetOfficesByCityIdAsync(int cityId);

        public Task<IEnumerable<City>> GetCitiesAsync(string countryCode = "BGR");

    }
}
