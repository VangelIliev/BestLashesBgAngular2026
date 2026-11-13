using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BestLashesBgAngular.Domain.Models.Econt
{
    public class Address
    {
        public City City { get; set; }

        public string? FullAddress { get; set; }

        public Address()
        {
            this.City = new City 
            { 
                Name = string.Empty 
            };
        }
    }
}
