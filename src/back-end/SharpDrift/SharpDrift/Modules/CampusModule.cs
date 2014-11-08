﻿using System.Collections.Generic;
using Nancy;
using Insight.Database;
using Insight.Database.Json;
using SharpDrift.Utilities;
using SharpDrift.DataModel;

namespace SharpDrift.Modules
{
    public class CampusModule : NancyModule
    {
        public CampusModule()
        {
            this.RequiresAuthentication();
            
            Get["/campus", true] = async (_, ctx) => 
                {
                    using (var conn = DAL.Conn)
                    {
                        IList<Campus> campus = await conn.QuerySqlAsync<Campus>("SELECT * FROM CAMPUS");
                        return new JsonNetObjectSerializer().SerializeObject(campus.GetType(), campus);
                    }
                };
        }
    }
}