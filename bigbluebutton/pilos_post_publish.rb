#!/usr/bin/ruby
# encoding: UTF-8

# --------------------
#
# PILOS - open source front-end for BigBlueButton
# https://github.com/THM-Health/PILOS
#
# Post publish script that is executed after each recording format has been published
# It will pack all files into a .tar archive and sends the data to PILOS
# for processing, storing and serving
#
# This script is based on the work of Scalelite (https://github.com/blindsidenetworks/scalelite/)
# and is modified to work with PILOS
#
# --------------------
#
# Copyright (c) 2012 BigBlueButton Inc. and by respective authors (see below).
#
# This program is free software; you can redistribute it and/or modify it under
# the terms of the GNU Lesser General Public License as published by the Free
# Software Foundation; either version 3.0 of the License, or (at your option)
# any later version.
#
# BigBlueButton is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
# FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
# details.
#
# You should have received a copy of the GNU Lesser General Public License along
# with BigBlueButton; if not, see <http://www.gnu.org/licenses/>.

require "optimist"
require 'psych'
require File.expand_path('../../../lib/recordandplayback', __FILE__)

# Helper script to get meeting metadata
def get_metadata(key, meeting_metadata)
  meeting_metadata.key?(key) ? meeting_metadata[key].value : nil
end

# Script arguments
opts = Optimist::options do
  opt :meeting_id, "Meeting id to archive", :type => String
  opt :format, "Playback format name", :type => String
end
meeting_id = opts[:meeting_id]
format = opts[:format]

# Init logging
logger = Logger.new("/var/log/bigbluebutton/post_publish.log", 'weekly' )
logger.level = Logger::INFO
BigBlueButton.logger = logger

# Load general BBB paths/configs
props = Psych.load_file(File.join(__dir__, '../bigbluebutton.yml'))
published_dir = props['published_dir'] || raise('Unable to determine published_dir from bigbluebutton.yml')
recording_dir = props['recording_dir'] || raise('Unable to determine recording_dir from bigbluebutton.yml')

# Config options of this script
config = Psych.load_file('/etc/bigbluebutton/recording/pilos.yml')
work_dir = config['work_dir'] || raise('Unable to determine work_dir from /etc/bigbluebutton/recording/pilos.yml')
spool_dir = config['spool_dir'] || raise('Unable to determine spool_dir from /etc/bigbluebutton/recording/pilos.yml')
extra_rsync_opts = config['extra_rsync_opts'] || []

# Path where the .tar file should be temporary stored
archive_file = "#{work_dir}/#{meeting_id}-#{format}.tar"

# Path were all recording files of the given format are stored at
published_files = "#{format}/#{meeting_id}"

# Get relevant metadata data of the meeting
meeting_metadata = BigBlueButton::Events.get_meeting_metadata("#{recording_dir}/raw/#{meeting_id}/events.xml")
origin = get_metadata("bbb-origin", meeting_metadata)
spool_sub_dir = get_metadata("pilos-sub-spool-dir", meeting_metadata) || ''

# Directory (local, NFS or via rsync) where to store the recording files
spool_dir = "#{spool_dir}#{spool_dir.end_with?('/') ? '' : '/'}#{spool_sub_dir}"

BigBlueButton.logger.info("Recording transferring to PILOS starts")

begin
    # Check if meeting is from PILOS, otherwise do nothing
    if origin == "PILOS"
        # Create work_dir if it doesn't exist yet
        FileUtils.mkdir_p(work_dir)

        # Create archive file
        BigBlueButton.logger.info("Creating recording archive for #{format} of meeting #{meeting_id}")
        system('tar', '--create', '--file', archive_file, '--directory', published_dir, published_files)

        # Transfer to spool_dir
        BigBlueButton.logger.info("Transferring recording archive for #{format} of meeting #{meeting_id} to #{spool_dir}")
        system('rsync', '--verbose', '--remove-source-files', '--chmod=664', *extra_rsync_opts, archive_file, spool_dir) \
          || raise('Failed to transfer recording archive')

        # BigBlueButton.logger.info('Create sender.done file');
        # File.write("#{recording_dir}/status/published/#{meeting_id}-#{format}-sender.done", "Published #{meeting_id}")
    else
        BigBlueButton.logger.info("Meeting #{meeting_id} from origin #{origin} - not a Pilos recording")
    end

rescue => e
  BigBlueButton.logger.info("Rescued")
  BigBlueButton.logger.info(e.to_s)

  # Cleanup
  FileUtils.remove_file(archive_file, true)
end

BigBlueButton.logger.info("Recording transferring to PILOS ends")

exit 0
