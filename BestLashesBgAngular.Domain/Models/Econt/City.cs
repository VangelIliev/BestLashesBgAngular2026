using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BestLashesBgAngular.Domain.Models.Econt
{
    public class City
    {
        public int Id { get; set; }

        public required string Name { get; set; }

        public string? NameEn { get; set; }

        public string? PostCode { get; set; }
    }
}
