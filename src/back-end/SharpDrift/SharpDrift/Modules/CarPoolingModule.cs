﻿using System;
using System.Runtime.InteropServices;
using System.Security.Cryptography.X509Certificates;
using Insight.Database;
using Nancy;
using Nancy.ModelBinding;
using SharpDrift.DataModel;
using SharpDrift.Utilities;
using SharpDrift.Utilities.Data;
using SharpDrift.Utilities.Security;

namespace SharpDrift.Modules
{
    public class CarPoolingModule : NancyModule
    {
        public CarPoolingModule()
        {
            this.RequiresAuthentication();

            Get["/carPoolings", true] = async (x, ctx) =>
            {
                using (var conn = DAL.Conn)
                {
                    return new
                    {
                        success = true,
                        joinedCarPoolings =
                            await
                                conn.QuerySqlAsync<CarPooling>(
                                    "SELECT * FROM carPooling WHERE idCarPooling IN (SELECT idCarPooling FROM joins WHERE idClient = @IdClient AND accept = TRUE)",
                                    new {IdClient = int.Parse(Context.CurrentUser.UserName)}),
                        waitingCarPoolings =
                            await
                                conn.QuerySqlAsync<CarPooling>(
                                    "SELECT * FROM carPooling WHERE idCarPooling IN (SELECT idCarPooling FROM joins WHERE idClient = @IdClient AND accept = FALSE)",
                                    new {IdClient = int.Parse(Context.CurrentUser.UserName)}),
                        offeredCarPoolings =
                            await conn.QuerySqlAsync<CarPooling>("SELECT * FROM carPooling WHERE idClient = @IdClient",
                                new {IdClient = int.Parse(Context.CurrentUser.UserName)})
                    }.ToJson();
                }
            };

            Get["/carPoolings/search", true] = async (x, ctx) =>
            {
                using (var conn = DAL.Conn)
                {
                    var data = this.BindAnonymous(new
                    {
                        @long = .0,
                        lat = .0,
                        radius = .0,
                        idCampus = 0,
                        campusToAddress = false,
                        minMeetTime = new DateTime(),
                        maxMeetTime = new DateTime()
                    });

                    return new
                    {
                        success = true,
                        carPoolings = await conn.QuerySqlAsync<CarPooling>(String.Join(" ",
                            "SELECT *",
                            "FROM carPooling",
                            "WHERE pow(@long - long, 2) + pow(@lat - lat, 2) < pow(@radius, 2)",
                            "AND idCampus = @idCampus",
                            "AND campusToAddress = @campusToAddress",
                            "AND meetTime BETWEEN @minMeetTime AND @maxMeetTime"), data)
                    }.ToJson();
                }
            };

            Post["/carPoolings/join", true] = async (x, ctx) =>
            {
                using (var conn = DAL.Conn)
                {
                    var c = this.Bind<CarPoolingJoin>();
                    //Desactivate for testing
                    //c.IdClient = Int32.Parse(Context.CurrentUser.UserName);

                    await
                        conn.ExecuteSqlAsync(
                            "INSERT INTO carPoolingJoin VALUES ( @IdCarPooling ,@IdClient, @Accepted)", c);

                    return new
                    {
                        success = true,
                        carPoolingJoin = c
                    }.ToJson();
                }
            };

            Delete["/carPoolings/join", true] = async (x, ctx) =>
            {
                using (var conn = DAL.Conn)
                {
                    var j = this.Bind<CarPoolingJoin>();
                    //Desactivate for testing
                    //j.IdClient = Int32.Parse(Context.CurrentUser.UserName);

                    await
                        conn.ExecuteSqlAsync(
                            "DELETE FROM carPoolingJoin WHERE idCarPooling = @IdCarPooling AND idClient = @IdClient", j);

                    return new
                    {
                        success = true,
                        carPoolingJoin = j
                    }.ToJson();
                }
            };

            Put["/carPooling/join", true] = async (x, ctx) =>
            {
                using (var conn = DAL.Conn)
                {
                    var j = this.Bind<CarPoolingJoin>();
                    //Only the creator of CarPooling can have this option or make a join  or update DB
                    //prop.IdClient = Int32.Parse(Context.CurrentUser.UserName);

                    await
                        conn.ExecuteSqlAsync(
                            "UPDATE carPoolingJoin SET accept = @Accepted WHERE idCarPooling = @IdCarPooling AND idClient = @IdClient",
                            j);

                    return new
                    {
                        success = true,
                        carPoolingJoin = j
                    }.ToJson();

                }
            };

        }
    }
}