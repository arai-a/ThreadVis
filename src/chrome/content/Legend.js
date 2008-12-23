/* *****************************************************************************
 * This file is part of ThreadVis.
 * http://threadvis.mozdev.org/
 *
 * ThreadVis started as part of Alexander C. Hubmann-Haidvogel's Master's Thesis
 * titled "ThreadVis for Thunderbird: A Thread Visualisation Extension for the
 * Mozilla Thunderbird Email Client" at Graz University of Technology, Austria.
 * An electronic version of the thesis is available online at
 * http://www.iicm.tugraz.at/ahubmann.pdf
 *
 * Copyright (C) 2005, 2006, 2007 Alexander C. Hubmann
 * Copyright (C) 2007, 2008 Alexander C. Hubmann-Haidvogel
 *
 * ThreadVis is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * ThreadVis is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with ThreadVis. If not, see <http://www.gnu.org/licenses/>.
 *
 * Version: $Id$
 * *****************************************************************************
 * JavaScript file to visualise legend
 ******************************************************************************/



/** ****************************************************************************
 * Clear the legend box
 *
 * @return
 *          void
 ******************************************************************************/
function clearLegend() {
    var legendBox = document.getElementById("LegendContent");
    while(legendBox.firstChild != null) {
        legendBox.removeChild(legendBox.firstChild);
    }
}



/** ****************************************************************************
 * Display the legend
 *
 * @return
 *          void
 ******************************************************************************/
function displayLegend() {
    clearLegend();

    var legendBox = document.getElementById("LegendContent");
    var legend = opener.THREADVIS.getLegend();
    legendBox.appendChild(legend);
    window.sizeToContent();
}