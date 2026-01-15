"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { FluencySession, FluencyAnalytics } from "@/types/fluency";
import { useTheme } from "next-themes";
import { Crown, Lock } from "lucide-react";

interface D3FluencyChartsProps {
  sessions: FluencySession[];
  analytics: FluencyAnalytics;
  isPremium?: boolean;
}

const D3FluencyCharts: React.FC<D3FluencyChartsProps> = ({ 
  sessions, 
  analytics, 
  isPremium = false 
}) => {
  const { theme } = useTheme();
  const scoreChartRef = useRef<SVGSVGElement>(null);
  const wpmChartRef = useRef<SVGSVGElement>(null);
  const progressChartRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    const handleResize = () => {
      const width = Math.min(800, window.innerWidth - 40);
      setDimensions({ width, height: 400 });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Score Trend Chart
  useEffect(() => {
    if (!scoreChartRef.current || sessions.length === 0) return;

    const svg = d3.select(scoreChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = dimensions.width - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Process data
    const data = sessions.slice(-10).map((session, index) => ({
      index,
      score: session.overallScore,
      date: new Date(session.startTime)
    }));

    // Theme-aware colors
    const isDark = theme === 'dark';
    const lineColor = isDark ? "#10b981" : "#059669";
    const gradientColor = isDark ? "#065f46" : "#047857";
    const gridColor = isDark ? "#374151" : "#e5e7eb";
    const textColor = isDark ? "#d1d5db" : "#6b7280";

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 100])
      .nice()
      .range([height, 0]);

    // Line generator
    const line = d3
      .line<{ index: number; score: number }>()
      .x(d => xScale(d.index))
      .y(d => yScale(d.score))
      .curve(d3.curveMonotoneX);

    // Area generator
    const area = d3
      .area<{ index: number; score: number }>()
      .x(d => xScale(d.index))
      .y0(height)
      .y1(d => yScale(d.score))
      .curve(d3.curveMonotoneX);

    // Gradient
    const gradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "score-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", yScale(100))
      .attr("x2", 0)
      .attr("y2", yScale(0));

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", gradientColor)
      .attr("stop-opacity", 0.1);

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", lineColor)
      .attr("stop-opacity", 0.6);

    // Area
    g.append("path")
      .datum(data)
      .attr("fill", "url(#score-gradient)")
      .attr("d", area);

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(() => ""))
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.3)
      .style("stroke", gridColor);

    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(() => ""))
      .style("stroke-dasharray", "3,3")
      .style("opacity", 0.3)
      .style("stroke", gridColor);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .style("font-size", "12px")
      .style("color", textColor);

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5))
      .style("font-size", "12px")
      .style("color", textColor);

    // Line
    const path = g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", lineColor)
      .attr("stroke-width", 3)
      .attr("d", line);

    // Animate line
    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr("stroke-dasharray", totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);

    // Points
    g.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.index))
      .attr("cy", d => yScale(d.score))
      .attr("r", 0)
      .attr("fill", lineColor)
      .attr("stroke", isDark ? "#1f2937" : "#ffffff")
      .attr("stroke-width", 2)
      .transition()
      .delay((d, i) => i * 100)
      .duration(300)
      .attr("r", 5);

    // Labels
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", textColor)
      .text("Fluency Score");

    g.append("text")
      .attr("transform", `translate(${width / 2}, ${height + margin.bottom})`)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", textColor)
      .text("Recent Sessions");

  }, [sessions, dimensions, theme]);

  // WPM Chart
  useEffect(() => {
    if (!wpmChartRef.current || sessions.length === 0) return;

    const svg = d3.select(wpmChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = dimensions.width - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const data = sessions.slice(-10).map((session, index) => ({
      index,
      wpm: session.metrics?.wordsPerMinute || 0
    }));

    const xScale = d3.scaleLinear().domain([0, data.length - 1]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, Math.max(200, d3.max(data, d => d.wpm) || 0)]).range([height, 0]);

    // Bars
    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d, i) => xScale(i) - 15)
      .attr("width", 30)
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", "#3b82f6")
      .attr("rx", 4)
      .transition()
      .delay((d, i) => i * 100)
      .duration(500)
      .attr("y", d => yScale(d.wpm))
      .attr("height", d => height - yScale(d.wpm));

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .style("font-size", "12px");

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5))
      .style("font-size", "12px");

    // Labels
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#666")
      .text("Words Per Minute");

  }, [sessions, dimensions]);

  // Progress Radar Chart
  useEffect(() => {
    if (!progressChartRef.current) return;

    const svg = d3.select(progressChartRef.current);
    svg.selectAll("*").remove();

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 40;

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const metrics = [
      { label: "Fluency", value: analytics.averageFluencyScore, max: 100 },
      { label: "WPM", value: Math.min(100, (analytics.averageWordsPerMinute / 150) * 100), max: 100 },
      { label: "Consistency", value: Math.min(100, (analytics.topMetrics.bestFluencyScore / analytics.averageFluencyScore) * 80), max: 100 },
      { label: "Duration", value: Math.min(100, (analytics.topMetrics.longestSpeech / 60000) * 100), max: 100 },
      { label: "Improvement", value: Math.min(100, Math.max(0, analytics.improvement * 10)), max: 100 }
    ];

    const angleScale = d3.scaleLinear()
      .domain([0, metrics.length])
      .range([0, 2 * Math.PI]);

    const radiusScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius]);

    // Grid circles
    [20, 40, 60, 80, 100].forEach(level => {
      g.append("circle")
        .attr("r", radiusScale(level))
        .style("fill", "none")
        .style("stroke", "#e5e7eb")
        .style("stroke-width", 1);
    });

    // Axes
    metrics.forEach((metric, i) => {
      const angle = angleScale(i) - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", y)
        .style("stroke", "#e5e7eb")
        .style("stroke-width", 1);

      // Labels
      const labelX = Math.cos(angle) * (radius + 20);
      const labelY = Math.sin(angle) * (radius + 20);
      
      g.append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", "12px")
        .style("fill", "#666")
        .text(metric.label);
    });

    // Data polygon
    const lineGenerator = d3.lineRadial<{ value: number }>()
      .angle((d, i) => angleScale(i) - Math.PI / 2)
      .radius(d => radiusScale(d.value))
      .curve(d3.curveLinearClosed);

    const gradient = svg
      .append("defs")
      .append("radialGradient")
      .attr("id", "radar-gradient");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#8b5cf6")
      .attr("stop-opacity", 0.6);

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#8b5cf6")
      .attr("stop-opacity", 0.2);

    g.append("path")
      .datum(metrics.map(m => ({ value: m.value })))
      .attr("d", lineGenerator)
      .style("fill", "url(#radar-gradient)")
      .style("stroke", "#8b5cf6")
      .style("stroke-width", 2);

    // Data points
    metrics.forEach((metric, i) => {
      const angle = angleScale(i) - Math.PI / 2;
      const x = Math.cos(angle) * radiusScale(metric.value);
      const y = Math.sin(angle) * radiusScale(metric.value);

      g.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 4)
        .style("fill", "#8b5cf6")
        .style("stroke", "white")
        .style("stroke-width", 2);
    });

  }, [analytics]);

  return (
    <div className="space-y-8">
      {/* Score Trend */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border dark:border-gray-800 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Fluency Score Trend</h3>
          {!isPremium && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Premium</span>
            </div>
          )}
        </div>
        <svg ref={scoreChartRef}></svg>
      </div>

      {/* WPM Chart */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border dark:border-gray-800 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Words Per Minute</h3>
          {!isPremium && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Premium</span>
            </div>
          )}
        </div>
        <svg ref={wpmChartRef}></svg>
      </div>

      {/* Radar Chart */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border dark:border-gray-800 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Overall Performance</h3>
          {!isPremium && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Premium</span>
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <svg ref={progressChartRef}></svg>
        </div>
      </div>

      {/* Premium Upgrade CTA for Charts */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-6 rounded-lg border-2 border-dashed text-center">
          <Crown className="h-8 w-8 mx-auto text-purple-600 mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Unlock Advanced Analytics</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Get detailed charts, custom date ranges, advanced insights, and export your data to multiple formats
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
                <span className="text-green-800 dark:text-green-200">📊</span>
              </div>
              <span>Custom Date Ranges</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                <span className="text-blue-800 dark:text-blue-200">📈</span>
              </div>
              <span>Advanced Insights</span>
            </div>
          </div>
          <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-colors">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade for Full Access
          </button>
        </div>
      )}
    </div>
  );
};

export default D3FluencyCharts;
