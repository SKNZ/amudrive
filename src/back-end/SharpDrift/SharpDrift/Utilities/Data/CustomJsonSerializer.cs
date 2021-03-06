﻿using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace SharpDrift.Utilities.Data
{
    internal sealed class CustomJsonSerializer : JsonSerializer
    {
        public CustomJsonSerializer()
        {
            ContractResolver = new CamelCasePropertyNamesContractResolver();
            Formatting = Formatting.Indented;
        }
    }
}