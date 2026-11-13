using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

namespace BestLashesBgAngular.Domain.Models.Econt
{
    public class Office
    {
        public Office()
        {
            this.Address = new Address();
        }
        public int Id { get; set; }

        public string? Code { get; set; }

        public required string Name { get; set; }

        public string? NameEn { get; set; }

        public Address Address { get; set; }
    }
}
