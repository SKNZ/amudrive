﻿using System;
using Nancy;
using Nancy.Bootstrapper;
using Nancy.Hosting.Self;
using Nancy.TinyIoc;

namespace SharpDrift
{
     public class CustomBootstrapper : DefaultNancyBootstrapper
		{
			protected override void ApplicationStartup(TinyIoCContainer container, IPipelines pipelines)
			{
				pipelines.AfterRequest.AddItemToEndOfPipeline((ctx) =>
				{
					ctx.Response.WithHeader("Access-Control-Allow-Origin", "*")
								.WithHeader("Access-Control-Allow-Methods", "POST,GET,PUT,DELETE")
								.WithHeader("Access-Control-Allow-Headers", "Accept, Origin, Content-type");

				});
			}
		}
    class Program
    {
		public class CustomBootstrapper : DefaultNancyBootstrapper
		{
			protected override void ApplicationStartup(TinyIoCContainer container, IPipelines pipelines)
			{
				pipelines.AfterRequest.AddItemToEndOfPipeline((ctx) =>
				{
					ctx.Response.WithHeader("Access-Control-Allow-Origin", "*")
								.WithHeader("Access-Control-Allow-Methods", "POST,GET,PUT,DELETE")
								.WithHeader("Access-Control-Allow-Headers", "Accept, Origin, Content-type");

				});
			}
		}
	
        public static void Main(string[] args)
        {
            using (var host = new NancyHost(new Uri("http://localhost:8989")))
            {
                host.Start();
                Console.ReadLine();
            }
        }
    }
}
